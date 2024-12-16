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
    cookieName: 'PetProject5',  
    secret: 'Abcde1234',  
    duration: 24 * 60 * 60 * 1000,  
    activeDuration: 1000 * 60 * 5,  
  })
);
app.use((req,res,next) =>{
  res.locals.session = req.session;
  next();
});
//helper middleware, will check if the user is logged in by verygying
function ensureLogin(req,res,next){
  if(!req.session.userName){
    return res.redirect('/login');
  }
  next();
}
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/solutions/projects', async (req, res) => {
  try {
    let projects;
    if (req.query.sector) {
      projects = await projectData.getProjectsBySector(req.query.sector);
      console.log('Projects by sector:', projects); // Add this line to check
      if (projects.length === 0) {
        return res.status(404).render('404', { message: `No projects found for sector: ${req.query.sector}` });
      }
    } else {
      projects = await projectData.getAllProjects();
      console.log('All projects:', projects); // Add this line to check
    }
    res.render('projects', { projects });
  } catch (err) {
    console.error('Error fetching projects:', err); // Log any errors
    res.status(404).render('404', { message: 'An error occurred while fetching projects.' });
  }
});

app.get('/solutions/projects/:id', async (req, res) => {
  try {
    const project = await projectData.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).render('404', { message: `Project with ID ${req.params.id} not found.` });
    }
    res.render('projectDetails', { project });
  } catch (err) {
    res.status(404).render('404', { message: 'An error occurred while fetching the project.' });
  }
});
app.get('/solutions/addProject', async (req, res) => {
  try {
    const sectors = await projectData.getAllSectors();
    res.render('AddProject', { sectors });
  } catch (err) {
    res.render('500', { message: 'Failed to load sectors' });
  }
});
app.post('/solutions/addProject', async (req, res) => {
  try {
    // Validation to ensure required fields are provided
    if (!req.body.title || !req.body.sector_id) {
      return res.status(400).render('500', { message: 'Title and Sector are required.' });
    }

    await projectData.addProject(req.body); // Adjust `addProject` to accept the correct structure
    res.redirect('/solutions/projects');
  } catch (err) {
    console.error('Error adding project:', err);
    res.status(500).render('500', { message: 'An error occurred while adding the project.' });
  }
});
app.get('/solutions/editProject/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await projectData.getProjectById(projectId);
    const sectors = await projectData.getAllSectors();

    if (!project) {
      return res.status(404).render('404', { message: `Project with ID ${projectId} not found.` });
    }
    res.render('editProject', { project, sectors });
  } catch (err) {
    res.status(404).render('404', { message: `Error fetching project or sectors: ${err.message}` });
  }
});
app.post('/solutions/editProject', async (req, res) => {
  const projectId = req.body.id;
  const projectDataInput = req.body;

  console.log('Edit Project Input:', projectId, projectDataInput); // Debugging

  try {
    await projectData.editProject(projectId, projectDataInput);
    res.redirect('/solutions/projects');
  } catch (err) {
    console.error('Error editing project:', err); // Debugging
    res.status(500).render('500', { message: `Error updating project: ${err.message}` });
  }
});
app.post('/solutions/deleteProject/:id', async (req, res) => {
  const projectId = req.params.id;

  console.log('Deleting Project with ID:', projectId); // Debugging

  try {
    await projectData.deleteProject(projectId);
    res.redirect('/solutions/projects');
  } catch (err) {
    console.error('Error deleting project:', err); // Debugging
    res.status(500).render('500', { message: `Error deleting project: ${err.message}` });
  }
});
app.use((req, res, next) => {
  res.status(404).render('404', { message: "I'm sorry, we're unable to find what you're looking for" });
});

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(process.env.MONGODB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => resolve())
      .catch((err) => reject(`Unable to connect to MongoDB: ${err}`));
  });
};
//add a login
app.get('/login',(req,res) =>{
  res.render('login',{errorMessage: "",userName:""});
});
app.get('/register',(req,res) =>{
  res.render('register',{errorMessage: "",userName:""});
});
app.post('/register',(req,res) =>{
  req.body.userAgent = req.get('User-Agent');
  authData.registerUser(req.body).then(() => {
    res.render('register',{errorMessage:"",successMessage:"User created",userName:""});
  })
  .catch((err) =>{
    res.render('register',{errorMessage: err,successMessage:"",userName:req.body.userName});
  });

});
app.post('/login',(req,res) =>{
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body).then((user) =>{
    req.session.user = {
      userName:userName,
      email:user.email,
      loginHistory:user.loginHistory,
    };
    res.redirect('/solutions/projects');
  }).catch((err) =>{
    res.render('login',{errorMessage:err,userName:req.body.userName});
  });
});
app.get('/logout',(req,res) =>{
  req.session.reset();
  res.redirect('/');
});
app.get('/userHistory',ensureLogin,(req,res) =>{
  res.render('userHistory');
});
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
