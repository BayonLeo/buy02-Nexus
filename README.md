E-Commerce Microservices Starter

This workspace contains a starter scaffold for a small e-commerce platform with three Spring Boot microservices:

- user-service: user registration, authentication (JWT), profile
- product-service: product CRUD (sellers only)
- media-service: media uploads with size/type validation

The scaffold provides core classes, controllers, and configuration to get you started. It uses MongoDB for persistence and JWT-based auth shared across services using a secret key (for demo). In production you should: use HTTPS, central auth service or OAuth2, service discovery, and secure secret management.

Requirements to run locally
- Java 17+ / OpenJDK
- Maven
- MongoDB running on localhost:27017

Next steps
- Customize and implement additional business logic and tests
- Add gateway and service discovery (Eureka) if needed
- Add Angular frontend in /frontend

Docker quick-start (optional)
------------------------------
I've added a `docker-compose.yml` and Dockerfiles for each backend service to make local testing easier. This will build the three Spring Boot services and bring up a MongoDB instance.

Quick run (from the repository root):

```powershell
docker-compose up --build
```

Important:
- The compose file sets example environment variables `JWT_SECRET` and `INTERNAL_TOKEN` — replace them with secure values before using in any shared environment.
- The services will be available on ports 8081 (user), 8082 (product), 8083 (media). Mongo is exposed on 27017.


See each service folder for run instructions.

Nexus Integration Guide (buy-02)
--------------------------------

This project is now wired to use Nexus for both dependency resolution and artifact publishing.

Prerequisites
- Java 11+ (project currently targets Java 17)
- Maven compatible with Java 11+ (Maven 3.8+ recommended)
- Nexus running at `http://localhost:8081`
- Maven repos already created in Nexus:
	- `maven-releases` (hosted)
	- `maven-snapshots` (hosted)
	- `maven-public` (group, includes `maven-central` proxy + hosted repos)

What is configured in this repository
- Backend service POMs now include `distributionManagement` for:
	- Releases: `http://localhost:8081/repository/maven-releases/`
	- Snapshots: `http://localhost:8081/repository/maven-snapshots/`
- Project-level Maven config in `.mvn/settings.xml`:
	- Mirrors all dependency/plugin requests through `maven-public`
	- Uses `NEXUS_USERNAME` and `NEXUS_PASSWORD` env vars for deploy auth
- Jenkins pipeline includes a `Publish Maven Artifacts to Nexus` stage.

Local publish flow
1. Set credentials in your shell:

```powershell
$env:NEXUS_USERNAME="admin"
$env:NEXUS_PASSWORD="adminadmin"
```

2. Build and publish snapshot artifacts:

```powershell
mvn -B clean deploy
```

3. Verify in Nexus UI:
- Browse `maven-snapshots` and check artifacts:
	- `com.example:media-service`
	- `com.example:product-service`
	- `com.example:user-service`
	- `com.example:order-service`

Dependency management through Nexus
- All Maven dependency/plugin downloads are routed through:
	- `http://localhost:8081/repository/maven-public/`
- This gives centralized caching and dependency control.

Versioning and release artifacts
1. Set a release version:

```powershell
mvn -B versions:set -DnewVersion=1.0.0
```

2. Publish release artifacts:

```powershell
mvn -B -DskipTests deploy
```

3. Bump to next development snapshot:

```powershell
mvn -B versions:set -DnewVersion=1.0.1-SNAPSHOT
```

4. Retrieve a specific version from Nexus (example):

```xml
<dependency>
	<groupId>com.example</groupId>
	<artifactId>user-service</artifactId>
	<version>1.0.0</version>
</dependency>
```

Docker image publishing to Nexus (hosted docker repo)
1. In Nexus, ensure the docker hosted repo has an HTTP connector port. The Jenkins pipeline expects `localhost:8082`.
2. Login and push images:

```powershell
docker login localhost:8082 -u admin -p adminadmin

docker build -t localhost:8082/user-service:1.0.0 ./backend/user-service
docker push localhost:8082/user-service:1.0.0

docker build -t localhost:8082/product-service:1.0.0 ./backend/product-service
docker push localhost:8082/product-service:1.0.0

docker build -t localhost:8082/media-service:1.0.0 ./backend/media-service
docker push localhost:8082/media-service:1.0.0

docker build -t localhost:8082/order-service:1.0.0 ./backend/order-service
docker push localhost:8082/order-service:1.0.0
```

CI pipeline Docker publishing
- Jenkins now logs into the Nexus docker registry and pushes the four backend images after the Maven publish stage.
- The pipeline uses these image names:
	- `localhost:8082/user-service:0.0.1-SNAPSHOT`
	- `localhost:8082/product-service:0.0.1-SNAPSHOT`
	- `localhost:8082/media-service:0.0.1-SNAPSHOT`
	- `localhost:8082/order-service:0.0.1-SNAPSHOT`
- If your Nexus docker connector uses a different port, update `NEXUS_DOCKER_REGISTRY` in [Jenkinsfile](Jenkinsfile).

CI pipeline integration
- Jenkins now publishes artifacts after tests and quality gate.
- Create a Jenkins credential:
	- Type: Username with password
	- ID: `nexus-admin`
	- Username: `admin`
	- Password: `adminadmin`

Security and access control (bonus)
- Create dedicated roles:
	- `nx-view-maven2-*-read` for consumers
	- `nx-repository-view-maven2-maven-snapshots-add` + read/edit for CI publisher
- Create separate CI user (do not use admin in production)
- Disable anonymous deploy permissions
- Restrict push permissions to release repo
- Rotate credentials and enable HTTPS/TLS in front of Nexus

Evidence for evaluation checklist
- Include screenshots in your report for:
	- Repositories list (`maven-releases`, `maven-snapshots`, `maven-public`, `docker`)
	- Successful `mvn deploy` build logs
	- Artifact browse page with multiple versions
	- Docker image tags in Nexus
	- Jenkins pipeline run including publish stage