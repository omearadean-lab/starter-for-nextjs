# 🚀 Appwrite Setup Instructions

Follow these steps to set up your CCTV Monitoring SaaS application with Appwrite.

## Step 1: Create API Key in Appwrite Console

1. Go to your [Appwrite Console](https://cloud.appwrite.io)
2. Select your project (`690c7785003337dac829`)
3. Navigate to **Settings** → **API Keys**
4. Click **Create API Key**
5. Configure the API key:
   - **Name**: `CCTV Setup Key`
   - **Expiration**: Set to a future date (or never)
   - **Scopes**: Select the following permissions:
     - `databases.read`
     - `databases.write`
     - `collections.read`
     - `collections.write`
     - `attributes.read`
     - `attributes.write`
     - `documents.read`
     - `documents.write`
     - `users.read`
     - `users.write`

6. Copy the generated API key

## Step 2: Update Environment Variables

1. Open the `.env` file in your project
2. Replace `your_api_key_here` with your actual API key:
   ```
   APPWRITE_API_KEY = "your_actual_api_key_here"
   ```

## Step 3: Run the Setup Script

Execute the setup script to create database collections and demo users:

```bash
npm run setup
```

This script will:
- ✅ Create all required database collections in your database (`690c79cc0014c7d18c28`)
- ✅ Set up proper attributes for each collection
- ✅ Create demo organization
- ✅ Create demo user accounts with different roles

## Step 4: Verify Setup

After running the setup script, you should see:

```
🎉 Appwrite setup completed successfully!

Demo credentials:
- Super Admin: admin@cctv.com / password123
- Org Admin: orgadmin@company.com / password123
- User: user@company.com / password123
```

## Step 5: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`

3. Try logging in with any of the demo credentials

## Troubleshooting

### If you get permission errors:
- Make sure your API key has all the required scopes
- Verify the API key is correctly set in `.env`

### If collections already exist:
- The script will skip existing collections and show warnings
- This is normal if you run the script multiple times

### If users already exist:
- The script will skip existing users and show warnings
- You can manually delete users in Appwrite Console if needed

### Database ID mismatch:
- Verify your database ID is `690c79cc0014c7d18c28`
- Update `DATABASE_ID` in the setup script if different

## Next Steps

Once setup is complete:

1. **Test all user roles** by logging in with different credentials
2. **Explore the dashboards** for each user type
3. **Add real camera data** through the camera management interface
4. **Configure alert settings** in organization settings
5. **Set up real AI detection** by implementing Appwrite Functions

## Security Notes

- **Remove or restrict the API key** after setup is complete
- **Change demo passwords** in production
- **Set up proper permissions** for each collection based on user roles
- **Enable 2FA** for admin accounts in production

## Support

If you encounter any issues:
1. Check the Appwrite Console for error logs
2. Verify all environment variables are set correctly
3. Ensure your Appwrite project has sufficient resources
4. Review the setup script output for specific error messages
