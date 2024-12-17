const projectData = require('./modules/projects');
const path = require('path');
const authData = require('./modules/auth-service');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const clientSessions = require('client-sessions');

const HTTP_PORT = process.env.PORT || 8080;
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.use(express.urlencoded({ extended: true }));
app.use(
  clientSessions({
    cookieName: 'PetProject5',  // The session cookie name
    secret: 'Abcde1234',  // Secret for encryption
    duration: 24 * 60 * 60 * 1000,  // 24 hours
    activeDuration: 1000 * 60 * 5,  // 5 minutes
  })
);

// Middleware to store session data in res.locals
app.use((req, res, next) => {
  console.log('Session Data:', req.PetProject5);  // Debugging session data
  res.locals.session = req.PetProject5;  // Use req.PetProject5 instead of req.session
  next();
});

// Middleware to check if user is logged in
function ensureLogin(req, res, next) {
  if (!req.PetProject5.user) {  // Check session data using req.PetProject5
    return res.redirect('/login');
  }
  next();
}

// Routes
app.get('/', (req, res) => {
  console.log('Rendering home page');
  res.render('home');
});

app.get('/about', (req, res) => {
  console.log('Rendering about page');
  res.render('about');
});

app.get('/login', (req, res) => {
  console.log('Rendering login page');
  res.render('login', { errorMessage: "", userName: "" }); // Test response instead of rendering view
});

app.get('/register', (req, res) => {
  console.log('Rendering register page');
  res.render('register', { errorMessage: "", successMessage: "", userName: "" });
});

app.post('/register', (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  console.log('Registering user:', req.body.userName);
  authData.registerUser(req.body)
    .then(() => {
      console.log('User registered successfully');
      res.render('register', { errorMessage: "", successMessage: "User created", userName: "" });
    })
    .catch((err) => {
      console.error('Error registering user:', err);
      res.render('register', { errorMessage: err, successMessage: "", userName: req.body.userName });
    });
});

app.post('/login', (req, res) => {
  const username = req.body.userName;
  const password = req.body.password;
  console.log('Attempting login for user:', username);
  authData.checkUser(username, password)
    .then((user) => {
      req.PetProject5.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      console.log('Login successful for:', username);
      res.redirect('/solutions/projects'); 
    })
    .catch((err) => {
      console.error('Login failed:', err);
      res.render('login', { errorMessage: err, userName: username });
    });
});

app.get('/logout', (req, res) => {
  console.log('Logging out user');
  req.PetProject5.reset();  // Reset session using the correct session object
  res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
  console.log('Rendering user history page');
  res.render('userHistory');
});

app.get('/solutions/projects', async (req, res) => {
  try {
    console.log('Fetching projects');
    let projects;
    if (req.query.sector) {
      projects = await projectData.getProjectsBySector(req.query.sector);
      console.log('Projects by sector:', projects);
      if (projects.length === 0) {
        return res.status(404).render('404', { message: `No projects found for sector: ${req.query.sector}` });
      }
    } else {
      projects = await projectData.getAllProjects();
      console.log('All projects:', projects);
    }
    res.render('projects', { projects });
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(404).render('404', { message: 'An error occurred while fetching projects.' });
  }
});

app.get('/solutions/projects/:id', async (req, res) => {
  try {
    console.log('Fetching project with ID:', req.params.id);
    const project = await projectData.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).render('404', { message: `Project with ID ${req.params.id} not found.` });
    }
    res.render('projectDetails', { project });
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(404).render('404', { message: 'An error occurred while fetching the project.' });
  }
});

app.get('/solutions/addProject', async (req, res) => {
  try {
    console.log('Fetching sectors for add project');
    const sectors = await projectData.getAllSectors();
    res.render('AddProject', { sectors });
  } catch (err) {
    console.error('Error loading sectors:', err);
    res.render('500', { message: 'Failed to load sectors' });
  }
});

app.post('/solutions/addProject', async (req, res) => {
  try {
    if (!req.body.title || !req.body.sector_id) {
      console.log('Title or Sector missing');
      return res.status(400).render('500', { message: 'Title and Sector are required.' });
    }
    await projectData.addProject(req.body);
    console.log('Project added successfully');
    res.redirect('/solutions/projects');
  } catch (err) {
    console.error('Error adding project:', err);
    res.status(500).render('500', { message: 'An error occurred while adding the project.' });
  }
});

app.get('/solutions/editProject/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    console.log('Fetching project for editing:', projectId);
    const project = await projectData.getProjectById(projectId);
    const sectors = await projectData.getAllSectors();
    if (!project) {
      return res.status(404).render('404', { message: `Project with ID ${projectId} not found.` });
    }
    res.render('editProject', { project, sectors });
  } catch (err) {
    console.error('Error fetching project or sectors:', err);
    res.status(404).render('404', { message: `Error fetching project or sectors: ${err.message}` });
  }
});

app.post('/solutions/editProject', async (req, res) => {
  const projectId = req.body.id;
  const projectDataInput = req.body;

  console.log('Edit Project Input:', projectId, projectDataInput); // Debugging

  try {
    await projectData.editProject(projectId, projectDataInput);
    console.log('Project updated successfully');
    res.redirect('/solutions/projects');
  } catch (err) {
    console.error('Error editing project:', err);
    res.status(500).render('500', { message: `Error updating project: ${err.message}` });
  }
});

app.post('/solutions/deleteProject/:id', async (req, res) => {
  const projectId = req.params.id;

  console.log('Deleting Project with ID:', projectId); // Debugging

  try {
    await projectData.deleteProject(projectId);
    console.log('Project deleted successfully');
    res.redirect('/solutions/projects');
  } catch (err) {
    console.error('Error deleting project:', err); // Debugging
    res.status(500).render('500', { message: `Error deleting project: ${err.message}` });
  }
});

app.use((req, res, next) => {
  console.log(`404 Error: ${req.originalUrl}`);  // Debugging
  res.status(404).render('404', { message: "I'm sorry, we're unable to find what you're looking for" });
});

// MongoDB connection initialization
module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(process.env.MONGODB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log('Connected to MongoDB');
        resolve();
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
        reject(`Unable to connect to MongoDB: ${err}`);
      });
  });
};

// Initialize projectData and authData
projectData
  .initialize()
  .then(authData.initialize) // Adding authData initialization to the chain
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Server listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Unable to start server: ${err}`);
  });
