import { render } from "solid-js/web";
import { Application } from "src/Application";
import "src/styles.css";

const root = document.getElementById("root");

if (root === null) {
  throw new Error("Missing application root.");
}

render(() => <Application />, root);
