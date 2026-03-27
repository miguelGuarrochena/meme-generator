import trollFace from "../assets/images/troll-face.png"

const  Header = () => {
    return (
        <header className="header">
            <img 
                src={trollFace} 
            />
            <h1>Meme Generator</h1>
        </header>
    )
}

export default Header