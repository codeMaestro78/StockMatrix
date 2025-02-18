const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://127.0.0.1:27017/myapp')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));




const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model('User', userSchema);

// Sign Up Endpoint
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Sign In Endpoint
app.post('/api/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found or Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    res.status(200).json({ message: 'Sign in successful' });
  } catch (error) {
    res.status(500).json({ error: 'Error signing in' });
  }
});


app.listen(5000, () => console.log('Server running on port 5000'));
