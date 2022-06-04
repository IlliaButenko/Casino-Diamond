import React, { useState, useEffect } from "react";
import Unity, { UnityContext } from "react-unity-webgl";
import jwtDecode from "jwt-decode";

const unityContext = new UnityContext({
    loaderUrl: "build/Build/build.loader.js",
    dataUrl: "build/Build/build.data",
    frameworkUrl: "build/Build/build.framework.js",
    codeUrl: "build/Build/build.wasm"
});

function Home() {
    useEffect(function () {
        unityContext.on("GameReady", function (message) {
            console.log("message", message)
            if (message == "Ready") {
                try {
                    window.onmessage = (e) => {
                        if (e.data.name === "iframe_message") {
                            let user = jwtDecode(e.data.token);
                            unityContext.send("UIManager", "RequestToken", JSON.stringify({
                                userName: user.name,
                                token: e.data.token,
                                amount: e.data.allowanceAmount
                            }));
                            console.log(e.data.token+"  ----------- "+e.data.allowanceAmount);
                        }
                    }
                    window.parent.postMessage({ name: "iframe_message" }, "*");
                } catch (err) {
                    console.log("error", err);
                }
            }
            else console.log("error");
        });
    }, []);

    return (
        <div>
            <Unity
                unityContext={unityContext}
                matchWebGLToCanvasSize={true}
                style={{ height: "100vh" }}
            />
        </div>
    );
}

export default Home