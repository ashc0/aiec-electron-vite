import './App.css'
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom'
import routes from '@/router'

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="App">
          <Link to='/about'>About</Link>
          <Routes>
            {routes.map((route, index) => (
              <Route
                key={index}
                path={
                  Array.isArray(route.path) ? route.path.join('/') : route.path
                }
                element={route.component ? <route.component /> : <></>}
              />
            ))}
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  )
}

export default App
