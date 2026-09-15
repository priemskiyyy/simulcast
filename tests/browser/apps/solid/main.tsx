import { render } from "solid-js/web";
import { Application } from "./Application";

const root = document.getElementById("root");
if (root === null) throw new Error("Missing test app root");
render(() => <Application />, root);
