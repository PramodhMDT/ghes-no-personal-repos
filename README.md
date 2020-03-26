# Automatically delete repositories created outside Organizations (personal repositories)

Node.js app that listens for `Repository.create` webhooks from a GitHub Enterprise Server and deletes the repository if it wasn't created in an Organization

## Build the image

* Create `.env` with needed environment variables

```bash
SHARED_SECRET=<webhook secret>
GHE_HOST=<hostname>
GHE_TOKEN=<Site admin token>
```

* Build the image locally

```bash
git clone https://github.com/jwiebalk/ghes-no-personal-repos.git
cd ghes-no-personal-repos
sudo docker build --rm=true -t ghes-no-personal-repos .
```

* Run container

```bash
sudo docker run -d -p 3000:3000 -t ghes-no-personal-repos
```

You can then check the `sudo docker logs $container` to see log output
