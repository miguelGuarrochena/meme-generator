
import Header from "./components/Header"
import Main from "./components/Main"
import { Analytics } from '@vercel/analytics/react';
import "./index.css"

function App() {


  return (
    <>
     <Header />
     <Main />
     <Analytics />
    </>
  )
}

export default App
