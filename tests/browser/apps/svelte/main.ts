import { mount } from "svelte";
import Application from "./Application.svelte";

const root = document.getElementById("root");
if (root === null) throw new Error("Missing test app root");
mount(Application, { target: root });
