# Cloud SQL Proxy (csqlp)

Command line tool to simplify using Google's Cloud SQL Proxy. It leverages Google Cloud SDK + Cloud SQL Proxy to fetch projects and instances from GCP and make 
starting a proxy as easy as you expect it to be.

## Usage

Before using `csqlp`, make sure you have:

- [Google Cloud SDK](https://cloud.google.com/sdk/docs?hl=pt-br) installed, authenticated on your account and added to your PATH
- [Cloud SQL Proxy](https://cloud.google.com/sql/docs/mysql/connect-admin-proxy), installed and added to your PATH

This is important: both `gcloud` and `cloud_sql_proxy` **must be globally available in your machine**.

Then, to run it directly, use

```bash
npx csqlp
```

Or, to install it in your machine

```bash
npm install -g csqlp
```

## 