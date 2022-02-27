import { getHeaderStyle } from "../utils"

export default function Header() {
    return (
        <div className="Header" style={getHeaderStyle()}>
            <header className="App-header">
                <p>
                    Here is the header of the page
                </p>
            </header>
        </div>
    );
}