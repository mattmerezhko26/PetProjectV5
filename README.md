#### **Project Title:**  
**Climate Solutions App - User Registration and Authentication**

#### **Project Description:**  
The Climate Solutions App is designed to manage projects related to climate change solutions while ensuring secure user registration and authentication. This project enhances the existing app by adding features like user accounts, session management, and password hashing for security. Registered users can access advanced functionalities such as adding, editing, and deleting projects, while unauthenticated users only have access to public pages like "Projects" and "About."

---

#### **Technologies Used:**  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (using Mongoose ODM)  
- **Authentication:** bcrypt.js for password hashing, client-sessions for session management  
- **Frontend:** HTML, EJS templates, CSS  
- **Environment Variables:** dotenv for secure configuration  

---

#### **Key Features:**  
1. **User Registration and Login:**  
   - Users can create accounts, log in securely, and log out.  
   - Session tracking is implemented to manage user activities.  

2. **Password Security:**  
   - Passwords are hashed using bcrypt.js before being stored in the database.  

3. **Role-Based Access:**  
   - Registered users can add, edit, and delete projects.  
   - Public views for unauthenticated users.  

4. **Session Management:**  
   - Client sessions track user activities and maintain a user-friendly experience.  

5. **Login History Tracking:**  
   - Records user login activities (timestamp and device details).  

---

#### **Improvements Over Previous Version:**  
- Enhanced security with hashed passwords.  
- Seamless user experience through persistent session management.  
- Organized modular structure for authentication (`auth-service.js`).  

---

#### **Getting Started:**  
Follow these steps to set up and run the project locally:  

1. **Clone the Repository:**  
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install Dependencies:**  
   ```bash
   npm install
   ```

3. **Set Up MongoDB Atlas:**  
   - Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).  
   - Create a new database and connection string.  
   - Add your connection string to a `.env` file:
     ```env
     MONGODB=<your_connection_string>
     ```

4. **Run the Application:**  
   ```bash
   npm start
   ```

5. **Access the App:**  
   - Open your browser and navigate to `http://localhost:<port>` (replace `<port>` with your server port).

---

#### **Future Enhancements:**  
- Integrating multi-factor authentication for added security.  
- Providing analytics on user activities.  
- Expanding project management functionalities with tagging and categorization.

--- 
