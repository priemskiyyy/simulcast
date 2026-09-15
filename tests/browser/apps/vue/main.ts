import { createApp } from "vue";
import Application from "./Application.vue";

const root = document.getElementById("root");
if (root === null) throw new Error("Missing test app root");
createApp(Application).mount(root);
