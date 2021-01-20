const prompts = require('prompts');
const { exec, execSync, spawn } = require('child_process');
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

})();

async function fetchProjects(): Promise<Project[]> {
  const spinner = ora('Fetching projects').start();
  const response = await commandExec(`gcloud projects list --format=json`);
  spinner.stop();

  return JSON.parse(response)
}

async function fetchInstances(project: Project): Promise<Instance[]> {
  const spinner = ora('Fetching instances').start();
  const response = await commandExec(`gcloud sql instances list --project=${project.projectId} --format=json`);
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

  return promptResponse.instance
}

async function promptPort(): Promise<string> {
  const promptResponse = await prompts({
    type: 'number',
    name: 'port',
    message: 'Select port'
  });

  return promptResponse.port
}

function startProxy(instance: Instance, port: string) {
  const args = `-instances=${instance.connectionName}=tcp:${port}`

  console.log("Running command: gcloud", args)

  const child = spawn('cloud_sql_proxy', [args]);

  // use child.stdout.setEncoding('utf8'); if you want text chunks
  child.stderr.on('data', (chunk: Buffer) => {
    // data from standard output is here as buffers
    console.log(chunk.toString())
  });

  child.on('close', (code: string) => {
    console.log(`child process exited with code ${code}`);
  });
}

async function commandExec(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (err: Error, stdout: string, stderr: string) => {

      resolve(stdout)
    });
  })
}