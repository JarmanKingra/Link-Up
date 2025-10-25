import { User } from "../model/users.model.js";
import httpStatus from "http-status";
import bcrypt, { hash } from "bcrypt";
import crypto from 'crypto';
import { Meeting } from "../model/meeting.model.js";
// import jwt from 'jsonwebtoken'

// const router = router();

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ message: "All fields are required" });
    }

    const user = await User.findOne({username});
    
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        return res.status(httpStatus.NOT_ACCEPTABLE).json({message: "Invalid Credentials"})
    } 

    const token = crypto.randomBytes(20).toString("hex");
    user.token = token;
    await user.save();

    return res.status(httpStatus.OK).json({token: token});
    
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Something went Wrong ${error}`});
  }
}

const register = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res.json({ message: "All fields are required" });
    }

    const user = await User.findOne({ username });

    if (user) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      username: username,
      name: name,
      password: hashedPassword,
    });

    await newUser.save();
    return res.status(httpStatus.CREATED).json({ message: "User created" });
  } catch (error) {
    return res.json({ message: error.message });
  }
}

const getUserHistory = async (req, res) => {
  const {token} = req.query;

  try {

    const user = await User.findOne({token: token});
    const meetings = await Meeting.find({user_id: user.username});
    res.json(meetings);
    
  } catch (e) {
    res.json({message: `Something went wrong ${e}`});
  }
}

const addToHistory = async (req, res) => {
  const {token, meeting_code} = req.body;

  try {
    const user = await User.findOne({token: token});
    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code
    })

    await newMeeting.save();

    res.status(httpStatus.CREATED).json({message: "Added code to History"})
  } catch (e) {
    res.json({message: `Something went wrong ${e}`});
  }
}

export {login, register, getUserHistory, addToHistory};
