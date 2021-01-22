#!/usr/bin/env node

const prompts = require('prompts');
const { exec, spawn } = require('child_process');
const ora = require('ora');

interface Project {
  name: string;
  projectId: string;
  projectNumber: string;
}

interface Instance {
  name: string;
  connectionName: string;
}

(async () => {

  console.log('Cloud SQL Proxy (csqlp)')

  try {
    await checkDependencies()

    // Fetch list of projects
    const projects = await fetchProjects()

    // Prompt user to select one project
    const selectedProject = await promptSelectProject(projects)

    // Fetch list of instances
    const instances = await fetchInstances(selectedProject)

    // Prompt user to select one instance
    const selectedInstance = await promptSelectInstance(instances)

    // Prompt user to input port
    const selectedPort = await promptPort()

    startProxy(selectedInstance, selectedPort)

  } catch (e) {
    if (e === "halt") {
      console.log('Bye!')
    } else {
      console.error(e)
    }
  }

})();

async function fetchProjects(): Promise<Project[]> {
  const spinner = ora('Fetching projects').start();
  const response = await cmdExec(`gcloud projects list --format=json`);
  spinner.stop();

  return JSON.parse(response)
}

async function fetchInstances(project: Project): Promise<Instance[]> {
  const spinner = ora('Fetching instances').start();
  const response = await cmdExec(`gcloud sql instances list --project=${project.projectId} --format=json`);
  spinner.stop();

  return JSON.parse(response)
}

async function promptSelectProject(projects: Project[]): Promise<Project> {
  const promptResponse = await prompts({
    type: 'select',
    name: 'project',
    message: 'Select project',
    choices: projects.map((project: Project) => ({
      title: project.name,
      value: project.projectId
    })),
    format: (selected: string) => projects.find((p: Project) => p.projectId === selected)
  });

  if (!promptResponse.project) throw 'halt'

  return promptResponse.project
}

async function promptSelectInstance(instances: Instance[]): Promise<Instance> {
  const promptResponse = await prompts({
    type: 'select',
    name: 'instance',
    message: 'Select instance',
    choices: instances.map((instance: Instance) => ({
      title: instance.name,
      value: instance.connectionName
    })),
    format: (selected: string) => instances.find((i: Instance) => i.connectionName === selected)
  });

  if (!promptResponse.instance) throw 'halt'

  return promptResponse.instance
}

async function promptPort(): Promise<string> {
  const promptResponse = await prompts({
    type: 'number',
    name: 'port',
    message: 'Input port',
    initial: '5432'
  });

  if (!promptResponse.port) throw 'halt'

  return promptResponse.port
}

function startProxy(instance: Instance, port: string) {
  const args = `-instances=${instance.connectionName}=tcp:${port}`

  console.log("Running command: ", args)

  const child = spawn('cloud_sql_proxy', [args]);

  // use child.stdout.setEncoding('utf8'); if you want text chunks
  child.stderr.setEncoding('utf8').on('data', (chunk: Buffer) => {
    // data from standard output is here as buffers
    console.log(chunk.toString())
  });

  child.on('close', (code: string) => {
    console.log(`child process exited with code ${code}`);
  });
}

async function checkDependencies(): Promise<boolean> {
  if (await cmdFindPath('gcloud') === "") {
    throw "Error: Could not find gcloud cli. Make sure gcloud is installed and available on your PATH before running csqlp. Find more at https://cloud.google.com/sdk/gcloud"
  }

  if (await cmdFindPath('cloud_sql_proxy') === "") {
    throw "Error: Could not find cloud_sql_proxy. Make sure cloud_sql_proxy is installed and available on your PATH before running csqlp. Find more at https://cloud.google.com/sql/docs/mysql/connect-admin-proxy"
  }

  return true
}

async function cmdExec(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (err: Error, stdout: string, stderr: string) => {
      if (err) {
        throw err;
      }

      resolve(stdout)
    });
  })
}

async function cmdFindPath(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`command -v ${command}`, (err: Error, stdout: string, stderr: string) => {
      if (err) {
        resolve("")
      } else {
        resolve(stdout)
      }
    });
  })
}