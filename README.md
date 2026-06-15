
# GRUBEX BACKEND API SERVER FOR DASHBOARD (USER, DRIVER, BUSINESS AND ADMIN)

This is the backend API Server for the GRUBEX User, Driver, Business and Admins dashboards.

## STACKS

## Main

1. Node
2. ExpressJS
3. MongoDB
4. ZOD

- Package Manager: `yarn`

## GET STARTED

1. Clone the repo and install dependencies using `npm install`
2. Duplicate the `.env.example.show` and rename one of them ot `.env`
3. Update the `.env with the appropriate values.
4. Use `yarn run dev` to run the server locally
5. **Always create a new branch** when working on a new task/feature you want to work on. Then **submit a pull request** when you're done with the task/feature. `<username>_<type>_<login-auth>` eg `learnuel_fix_auth`, `learnuel_feat_user-model` etc.
6. Follow the commit message convention bellow

## API DOCUMENTATION 
https://documenter.getpostman.com/view/20542554/2sA3Bj9u4M
## Commit Message Pattern Convention

You're to follow this convention when creating a commit message

```bash
    type(scope?): message
```

Example

```bash
    feat(model): added account model
    fix: update the account model paths
``` 

### FRONTEND 
https://brubex-frontend.vercel.app/
### Common types

- build
- chore
- ci
- docs
- feat
- fix
- perf
- refactor
- revert
- style
- test


Read more about it here [Commit Lint Doc](https://www.conventionalcommits.org/en/v1.0.0/) and here [Common Types Usage Text](https://commitlint.js.org/#/reference-prompt) to know more.


## FOLDER STRUCTURE
```
grubbex-backend/ 
src
|
├───api
│   ├───admin
│   │   ├───controller
│   │   └───services
│   ├───business
│   │   ├───controller
│   │   ├───schema
│   │   └───service
│   └───store
│       ├───controller
│       ├───schema
│       └───service
├───config
│   └───database
├───controllers
├───logger
├───middlewares
├───models
├───routes
├───services
├───shared
│   ├───controller
│   ├───middleware
│   ├───schema
│   ├───services
│   └───utils
├───utils
└───views
```
