import { createApp } from "vue";
import Application from "src/Application.vue";
import "src/styles.css";

const root = document.getElementById("root");

if (root === null) {
  throw new Error("Missing application root.");
}

createApp(Application).mount(root);
