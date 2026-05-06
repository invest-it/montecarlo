import { useEffect, useState } from "react";
import { socket } from "./socket";
import { ConnectionManager } from "./ConnectionManager";
import { ConnectionState } from "./ConnectionState";
import { Events } from "./Events";
import { MyForm } from "./MyForm";

export function App() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [fooEvents, setFooEvents] = useState([]);

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        function onFooEvent(value: never) {
            setFooEvents((previous) => [...previous, value]);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("foo", onFooEvent);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("foo", onFooEvent);
        };
    }, []);

    return (
        <div className="app">
            <ConnectionState isConnected={isConnected} />
            <Events events={fooEvents} />
            <ConnectionManager />
            <MyForm />
        </div>
    );
}

export default App;
