import OpenAI from 'openai';

/**
 * OpenAI Vision API Integration for CCTV AI Detection
 * Uses GPT-4 Vision to analyse camera feeds for security events
 */

export class OpenAIVisionProvider {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Analyse image for multiple detection types using GPT-4 Vision
   */
  async analyseImage(imageBuffer, detectionTypes = ['all']) {
    try {
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      const prompt = this.buildAnalysisPrompt(detectionTypes);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1 // Low temperature for consistent analysis
      });

      const analysis = response.choices[0].message.content;
      return this.parseAnalysisResponse(analysis);

    } catch (error) {
      console.error('OpenAI Vision API error:', error);
      throw error;
    }
  }

  /**
   * Build analysis prompt based on detection types
   */
  buildAnalysisPrompt(detectionTypes) {
    const basePrompt = `You are an AI security analyst examining CCTV footage. Analyse this image for the following security concerns and respond in JSON format:

DETECTION TYPES TO ANALYSE:`;

    const detectionPrompts = {
      fall: `
- FALL DETECTION: Look for people who have fallen down, are lying on the ground, or in distress positions. Consider body posture, positioning, and context.`,
      
      fire: `
- FIRE DETECTION: Look for flames, smoke, fire, burning objects, or signs of fire hazards. Check for orange/red flame colours, smoke patterns, or heat distortion.`,
      
      theft: `
- THEFT DETECTION: Look for suspicious behaviour such as concealing items, looking around nervously, putting items in bags/pockets without paying, or attempting to leave without payment.`,
      
      face: `
- FACE DETECTION: Identify and count human faces in the image. Note if faces are clearly visible or obscured.`,
      
      intrusion: `
- INTRUSION DETECTION: Look for people in restricted areas, climbing fences, breaking barriers, or accessing areas they shouldn't be in.`,
      
      violence: `
- VIOLENCE DETECTION: Look for aggressive behaviour, fighting, threatening gestures, or physical altercations between people.`
    };

    let fullPrompt = basePrompt;
    
    if (detectionTypes.includes('all')) {
      fullPrompt += Object.values(detectionPrompts).join('');
    } else {
      detectionTypes.forEach(type => {
        if (detectionPrompts[type]) {
          fullPrompt += detectionPrompts[type];
        }
      });
    }

    fullPrompt += `

RESPONSE FORMAT (JSON):
{
  "detections": [
    {
      "type": "fall|fire|theft|face|intrusion|violence",
      "confidence": 0.0-1.0,
      "description": "Detailed description of what was detected",
      "severity": "low|medium|high|critical",
      "location": "Description of where in the image",
      "recommendations": "Suggested actions",
      "bounding_area": "General area description (e.g., 'center-left', 'top-right')"
    }
  ],
  "overall_assessment": "General security assessment of the scene",
  "immediate_action_required": true/false
}

Only include detections where you are reasonably confident (>0.6). Be specific and accurate in your analysis.`;

    return fullPrompt;
  }

  /**
   * Parse the AI response into structured detection results
   */
  parseAnalysisResponse(analysisText) {
    try {
      // Extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      const detections = [];

      if (analysis.detections && Array.isArray(analysis.detections)) {
        for (const detection of analysis.detections) {
          if (detection.confidence >= 0.6) {
            detections.push({
              detectionType: detection.type,
              confidence: detection.confidence,
              description: detection.description,
              severity: detection.severity,
              boundingBoxes: this.estimateBoundingBox(detection.bounding_area),
              metadata: {
                ai_provider: 'openai_vision',
                location: detection.location,
                recommendations: detection.recommendations,
                analysis_timestamp: new Date().toISOString()
              }
            });
          }
        }
      }

      return {
        detections,
        overallAssessment: analysis.overall_assessment,
        immediateActionRequired: analysis.immediate_action_required
      };

    } catch (error) {
      console.error('Error parsing AI analysis:', error);
      return { detections: [], overallAssessment: 'Analysis failed', immediateActionRequired: false };
    }
  }

  /**
   * Estimate bounding box from area description
   */
  estimateBoundingBox(areaDescription) {
    if (!areaDescription) return [];

    const areaMap = {
      'center': { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
      'top-left': { x: 0, y: 0, width: 0.5, height: 0.5 },
      'top-right': { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      'bottom-left': { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      'bottom-right': { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
      'left': { x: 0, y: 0.25, width: 0.5, height: 0.5 },
      'right': { x: 0.5, y: 0.25, width: 0.5, height: 0.5 },
      'top': { x: 0.25, y: 0, width: 0.5, height: 0.5 },
      'bottom': { x: 0.25, y: 0.5, width: 0.5, height: 0.5 }
    };

    const area = areaMap[areaDescription.toLowerCase()] || areaMap['center'];
    
    // Convert to pixel coordinates (assuming 1920x1080 image)
    return [{
      x: Math.round(area.x * 1920),
      y: Math.round(area.y * 1080),
      width: Math.round(area.width * 1920),
      height: Math.round(area.height * 1080)
    }];
  }

  /**
   * Specialised fall detection analysis
   */
  async detectFall(imageBuffer) {
    const result = await this.analyseImage(imageBuffer, ['fall']);
    const fallDetections = result.detections.filter(d => d.detectionType === 'fall');
    
    if (fallDetections.length > 0) {
      return {
        ...fallDetections[0],
        metadata: {
          ...fallDetections[0].metadata,
          emergency_response: true,
          detection_method: 'ai_vision_analysis'
        }
      };
    }
    
    return null;
  }

  /**
   * Specialised fire detection analysis
   */
  async detectFire(imageBuffer) {
    const result = await this.analyseImage(imageBuffer, ['fire']);
    const fireDetections = result.detections.filter(d => d.detectionType === 'fire');
    
    if (fireDetections.length > 0) {
      return {
        ...fireDetections[0],
        metadata: {
          ...fireDetections[0].metadata,
          emergency_services_required: true,
          evacuation_recommended: fireDetections[0].severity === 'critical'
        }
      };
    }
    
    return null;
  }

  /**
   * Specialised theft detection analysis
   */
  async detectTheft(imageBuffer) {
    const result = await this.analyseImage(imageBuffer, ['theft']);
    const theftDetections = result.detections.filter(d => d.detectionType === 'theft');
    
    if (theftDetections.length > 0) {
      return {
        ...theftDetections[0],
        metadata: {
          ...theftDetections[0].metadata,
          security_alert: true,
          review_required: true
        }
      };
    }
    
    return null;
  }

  /**
   * Comprehensive security analysis
   */
  async performSecurityAnalysis(imageBuffer) {
    const result = await this.analyseImage(imageBuffer, ['all']);
    
    return {
      detections: result.detections,
      securityAssessment: {
        overallThreatLevel: this.calculateThreatLevel(result.detections),
        immediateActionRequired: result.immediateActionRequired,
        recommendations: this.generateRecommendations(result.detections),
        analysisTimestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Calculate overall threat level
   */
  calculateThreatLevel(detections) {
    if (detections.length === 0) return 'none';
    
    const criticalCount = detections.filter(d => d.severity === 'critical').length;
    const highCount = detections.filter(d => d.severity === 'high').length;
    
    if (criticalCount > 0) return 'critical';
    if (highCount > 0) return 'high';
    if (detections.length > 2) return 'medium';
    return 'low';
  }

  /**
   * Generate security recommendations
   */
  generateRecommendations(detections) {
    const recommendations = [];
    
    detections.forEach(detection => {
      switch (detection.detectionType) {
        case 'fall':
          recommendations.push('Immediate medical assistance may be required');
          recommendations.push('Check on the person\'s wellbeing');
          break;
        case 'fire':
          recommendations.push('Contact emergency services immediately');
          recommendations.push('Initiate evacuation procedures if necessary');
          break;
        case 'theft':
          recommendations.push('Review footage and alert security personnel');
          recommendations.push('Consider approaching the individual if safe to do so');
          break;
        case 'intrusion':
          recommendations.push('Alert security team immediately');
          recommendations.push('Monitor the individual\'s movements');
          break;
      }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }
}

export default OpenAIVisionProvider;
