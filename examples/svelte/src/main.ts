import { mount } from "svelte";
import Application from "src/Application.svelte";
import "src/styles.css";

const root = document.getElementById("root");

if (root === null) {
  throw new Error("Missing application root.");
}

mount(Application, { target: root });
