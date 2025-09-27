
import './App.css'
import Authentication from './pages/authentication';
import LandingPage from './pages/landing';
import {Route, BrowserRouter, Routes} from "react-router-dom"


function App() {


  return (
    <>
      <BrowserRouter>
        <Routes>

          <Route path='/' element={<LandingPage/>}/>
          <Route path='/auth' element={<Authentication/>}/>
          <Route path='*' element={<div>404 Not Found</div>} />
           
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;
