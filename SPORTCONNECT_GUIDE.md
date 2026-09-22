# 🏆 SportConnect — Master Architecture & End-to-End Feature Workflow Guide

---

## 📑 Table of Contents
1. [Platform Overview & Tech Stack](#1-platform-overview--tech-stack)
2. [High-Level Design (HLD)](#2-high-level-design-hld)
   - [2.1 Overall System Architecture](#21-overall-system-architecture)
   - [2.2 Deployment & Network Topology (Docker SSR Networking)](#22-deployment--network-topology-docker-ssr-networking)
   - [2.3 Security & Authentication Architecture](#23-security--authentication-architecture)
3. [Low-Level Design (LLD)](#3-low-level-design-lld)
   - [3.1 Database Entity-Relationship (ER) Model](#31-database-entity-relationship-er-model)
   - [3.2 Frontend Architecture & Redux State Tree](#32-frontend-architecture--redux-state-tree)
   - [3.3 Backend Controller & Routing Design](#33-backend-controller--routing-design)
4. [End-to-End Feature Working Flows](#4-end-to-end-feature-working-flows)
   - [Flow 1: User Authentication & OAuth System](#flow-1-user-authentication--oauth-system)
   - [Flow 2: Athlete Scouting Profile & PDF Resume Generation](#flow-2-athlete-scouting-profile--pdf-resume-generation)
   - [Flow 3: Social Feed, Media Posts & Interaction Hub](#flow-3-social-feed-media-posts--interaction-hub)
   - [Flow 4: Athlete Networking & Connection Lifecycle](#flow-4-athlete-networking--connection-lifecycle)
   - [Flow 5: Squads & Teams Management Engine (with Live Chat)](#flow-5-squads--teams-management-engine-with-live-chat)
   - [Flow 6: Tournament Hub, Multi-Sport Scoring & Standings](#flow-6-tournament-hub-multi-sport-scoring--standings)
   - [Flow 7: Actionable Real-Time Notification Engine](#flow-7-actionable-real-time-notification-engine)
5. [Complete API Specification Summary](#5-complete-api-specification-summary)

---

## 1. Platform Overview & Tech Stack

**SportConnect** is a sports social platform and tournament management system built for athletes, squad captains, coaches, and event organizers.

### Technology Matrix

| Layer | Technology | Key Responsibility |
| :--- | :--- | :--- |
| **Frontend UI/UX** | **Next.js 15 (Pages Router)**, React 18 | SSR & CSR rendering, athlete scouting pages, responsive layouts |
| **State Management** | **Redux Toolkit** | Global authentication state, feed posts, user connection data |
| **Styling** | **Vanilla CSS Modules** | Custom dark navy sports design tokens, glassmorphism, responsive grid |
| **Backend API** | **Node.js, Express.js (ESM)** | REST API routing, business logic, file storage, security checks |
| **Database & ODM** | **MongoDB, Mongoose ODM** | Document database, complex population queries, schema indexing |
| **Auth & Security** | **Crypto (SHA-256 / 256-bit Hex)**, **Bcrypt.js** | Token session management, password hashing, OTP expiry TTL |
| **Document Generation**| **PDFKit** | Real-time athletic scouting resume PDF compilation & streaming |
| **Media Handling** | **Multer** | Multi-part form parsing, disk storage for profile pictures, posts, photos |
| **DevOps & Containers**| **Docker, Docker Compose** | Multi-container orchestration, internal bridge network routing |

---

## 2. High-Level Design (HLD)

### 2.1 Overall System Architecture

The following diagram illustrates the high-level tier breakdown across client browsers, Next.js frontend, Express API gateway, persistent storage, and third-party integrations:

```mermaid
graph TB
    subgraph Client_Layer ["Client Tier (Athletes, Captains, Organizers)"]
        Browser["Desktop & Mobile Browsers<br/>(React 18 / Next.js SPA View)"]
    end

    subgraph Frontend_Layer ["Frontend Application Tier (Port 3000)"]
        NextServer["Next.js SSR Server Engine"]
        ReduxStore["Redux Toolkit Store<br/>(Auth, Posts, Notifications)"]
        AxiosClient["Axios API Client<br/>(CSR: http://localhost:9000<br/>SSR: http://backend:9000)"]
        UI_Components["UI Modules<br/>- Navbar with Notifications<br/>- Feed & Comments<br/>- Squads Manager<br/>- Tournament Engine<br/>- Scouting Profile"]
    end

    subgraph Backend_Layer ["Backend API Tier (Port 9000)"]
        ExpressApp["Express.js Core Application"]
        RouterGateway["Express Router Gateway"]
        
        subgraph Controllers ["Business Logic Controllers"]
            UserCtrl["User & Auth Controller<br/>(OAuth, OTP, Profiles, Resumes)"]
            PostCtrl["Posts Controller<br/>(Feed, Media, Likes, Comments)"]
            TeamCtrl["Team & Squad Controller<br/>(Rosters, Invites, Approvals)"]
            MsgCtrl["Squad Message Controller<br/>(Team Chat System)"]
            EventCtrl["Sport Event Controller<br/>(Brackets, Multi-Sport Scoring, Standings)"]
        end

        subgraph Engines ["Specialized Service Engines"]
            PDFGen["PDFKit Athlete Resume Generator"]
            MulterUpload["Multer Local Media Storage Engine"]
            MailService["Nodemailer OTP Email Engine"]
        end
    end

    subgraph Data_Layer ["Persistent Data Tier"]
        MongoDB[("MongoDB Database<br/>(10 Collections)")]
        FileStorage[("Persistent File System<br/>/uploads directory")]
    end

    subgraph External_Services ["External Service Providers"]
        GoogleOAuth["Google Identity Services (OAuth2)"]
        GitHubOAuth["GitHub OAuth 2.0 API"]
        SMTPServer["Gmail SMTP Mail Server"]
    end

    %% Client Interactions
    Browser <--> NextServer
    NextServer <--> UI_Components
    UI_Components <--> ReduxStore
    UI_Components <--> AxiosClient

    %% Frontend to Backend
    AxiosClient <--> ExpressApp
    ExpressApp --> RouterGateway
    RouterGateway --> UserCtrl
    RouterGateway --> PostCtrl
    RouterGateway --> TeamCtrl
    RouterGateway --> MsgCtrl
    RouterGateway --> EventCtrl

    %% Backend to Engines & Database
    UserCtrl --> PDFGen
    UserCtrl --> MulterUpload
    UserCtrl --> MailService
    PostCtrl --> MulterUpload
    EventCtrl --> MulterUpload

    UserCtrl <--> MongoDB
    PostCtrl <--> MongoDB
    TeamCtrl <--> MongoDB
    MsgCtrl <--> MongoDB
    EventCtrl <--> MongoDB

    MulterUpload --> FileStorage
    PDFGen --> Browser

    %% External Integrations
    UserCtrl <--> GoogleOAuth
    UserCtrl <--> GitHubOAuth
    MailService <--> SMTPServer
```

---

### 2.2 Deployment & Network Topology (Docker SSR Networking)

```mermaid
flowchart LR
    subgraph Host_Machine ["Host Machine (Developer / Production)"]
        HostBrowser["Web Browser<br/>http://localhost:3000"]
    end

    subgraph Docker_Bridge ["Docker Compose Bridge Network"]
        subgraph Frontend_Container ["frontend (Container Port 3000)"]
            SSR_Client["Next.js Node Process<br/>(Uses INTERNAL_API_URL=http://backend:9000)"]
            CSR_Bundle["React Bundle in Browser<br/>(Uses NEXT_PUBLIC_BASE_URL=http://localhost:9000)"]
        end

        subgraph Backend_Container ["backend (Container Port 9000)"]
            API_Server["Express Server (:9000)"]
            Uploads_Vol["Persistent Volume: /app/uploads"]
        end

        subgraph DB_Container ["MongoDB (Container Port 27017)"]
            Mongo_Service["MongoDB Daemon (:27017)"]
        end
    end

    HostBrowser -- "1. Initial Page Load" --> SSR_Client
    SSR_Client -- "2. SSR Data Fetch (Direct DNS)" --> API_Server
    HostBrowser -- "3. CSR API Calls & Sockets" --> API_Server
    API_Server -- "4. Database Operations" --> Mongo_Service
    API_Server -- "5. Store/Serve Media" --> Uploads_Vol
```

> [!NOTE]
> **Dual Networking Architecture:**
> 1. **Client-Side Requests (CSR):** Requests originate in user's browser, communicating via `http://localhost:9000`.
> 2. **Server-Side Rendering (SSR):** Requests originate inside the Next.js container during `getServerSideProps`, communicating via Docker DNS `http://backend:9000` via `serverClient`.

---

### 2.3 Security & Authentication Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Athlete as Athlete / Client
    participant AuthCtrl as User Controller (Auth)
    participant OTPStore as MongoDB (OTP Collection)
    participant UserStore as MongoDB (User Collection)
    participant SMTP as Nodemailer / SMTP

    Note over Athlete, SMTP: Step A: 2-Factor Registration with Time-Bound OTP
    Athlete->>AuthCtrl: POST /auth/send-otp { email, type: 'registration' }
    AuthCtrl->>AuthCtrl: Generate 6-digit cryptographic OTP & hash with SHA-256
    AuthCtrl->>OTPStore: Save { email, otpHash, type, expires: 300s (TTL) }
    AuthCtrl->>SMTP: Send HTML Email with OTP
    SMTP-->>Athlete: Receive 6-digit OTP in inbox
    Athlete->>AuthCtrl: POST /auth/register { name, username, email, password, otp }
    AuthCtrl->>OTPStore: Find OTP doc by email & type; Compare SHA-256(otp)
    AuthCtrl->>UserStore: Create User with Bcrypt hashedPassword & 256-bit token
    AuthCtrl-->>Athlete: 200 OK + { token, user profile }

    Note over Athlete, SMTP: Step B: Stateful Token Validation
    Athlete->>AuthCtrl: Request with Header: x-auth-token or Body: { token }
    AuthCtrl->>UserStore: User.findOne({ token })
    UserStore-->>AuthCtrl: Valid User Document
    AuthCtrl-->>Athlete: Authorized Response
```

---

## 3. Low-Level Design (LLD)

### 3.1 Database Entity-Relationship (ER) Model

```mermaid
erDiagram
    USER ||--o| PROFILE : "has 1:1"
    USER ||--o{ POST : "creates"
    USER ||--o{ COMMENT : "writes"
    USER ||--o{ CONNECTION_REQUEST : "sends/receives"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ TEAM : "creates as captain"
    USER }o--o{ TEAM : "joins as member"
    USER ||--o{ TEAM_MESSAGE : "posts in squad chat"
    USER ||--o{ SPORT_EVENT : "hosts"
    USER }o--o{ SPORT_EVENT : "follows"
    USER ||--o{ EVENT_PHOTO : "uploads"
    SPORT_EVENT ||--o{ EVENT_MATCH : "schedules"
    SPORT_EVENT ||--o{ EVENT_PHOTO : "contains"

    USER {
        ObjectId _id PK
        string name
        string username UK
        string email UK
        string password
        string provider "email | google | github"
        boolean active
        string profilePicture
        string token
        Date createdAt
    }

    PROFILE {
        ObjectId _id PK
        ObjectId userId FK
        string bio
        string currentPost
        Array pastWork "[company, position, years]"
        Array education "[school, degree, fieldOfStudy]"
    }

    POST {
        ObjectId _id PK
        ObjectId userId FK
        string body
        Array likes "string[] userIds"
        string media
        string fileType
        boolean active
        Date createdAt
        Date updatedAt
    }

    COMMENT {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId postId FK
        string body
        Date createdAt
        Date updatedAt
    }

    CONNECTION_REQUEST {
        ObjectId _id PK
        ObjectId userId FK "Sender"
        ObjectId connectionId FK "Target Athlete"
        boolean status_accepted "null=pending | true=accepted | false=rejected"
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId userId FK "Recipient"
        ObjectId senderId FK "Triggering User"
        string type "connection_request | comment | team_invite | team_join_request | like | team_message | event_invite"
        ObjectId relatedId "teamId | postId | eventId"
        string message
        boolean isRead
        Date createdAt
    }

    TEAM {
        ObjectId _id PK
        string name UK
        string sport
        string description
        ObjectId creatorId FK "Captain"
        Array members "ObjectId[] User FKs"
        number maxSize
        Date createdAt
    }

    TEAM_MESSAGE {
        ObjectId _id PK
        ObjectId teamId FK
        ObjectId senderId FK
        string message
        Date createdAt
    }

    SPORT_EVENT {
        ObjectId _id PK
        string name
        string description
        ObjectId hostId FK
        Date startDate
        Date endDate
        string eventKey UK "8-char uppercase"
        string coverImage
        Array followers "ObjectId[] User FKs"
        Array sports "[sportName, advanceCount, teams, standings]"
        Date createdAt
    }

    EVENT_MATCH {
        ObjectId _id PK
        ObjectId eventId FK
        string sport
        Object homeTeam "{name, color}"
        Object awayTeam "{name, color}"
        number homeScore
        number awayScore
        string period "1st Half | Q1 | 2nd Innings etc."
        Mixed scoreDetails "Quarter, Sets, Wickets breakdown"
        string status "scheduled | live | completed"
        string round "Group Stage | Semis | Finals"
        Date matchDate
        string venue
        string winner
    }

    EVENT_PHOTO {
        ObjectId _id PK
        ObjectId eventId FK
        ObjectId hostId FK
        string caption
        string media
        string fileType
        Array likes "string[] userIds"
        Date createdAt
    }

    OTP {
        ObjectId _id PK
        string email
        string otpHash
        string type "registration | password_reset"
        number attempts
        Date createdAt "TTL 300s"
    }
```

---

### 3.2 Frontend Architecture & Redux State Tree

```mermaid
graph TD
    App["_app.js (Root Provider)"]
    Store["Redux Store (store.js)"]
    App --> Store

    subgraph Reducers ["Redux Reducers"]
        AuthReducer["authReducer<br/>- user: object<br/>- token: string<br/>- is_authenticated: bool<br/>- profile_data: object"]
        PostReducer["postReducer<br/>- posts: array<br/>- comments: array<br/>- is_loading: bool"]
    end
    Store --> AuthReducer
    Store --> PostReducer

    subgraph Pages ["Next.js Pages & Layouts"]
        UserLayout["UserLayout / DashboardLayout"]
        NavComp["Navbar Component<br/>- Sticky Top Bar<br/>- Live Notifications<br/>- Accept/Decline Handlers"]
        
        P_Dash["/dashboard (Social Feed & Stats)"]
        P_Profile["/profile (Edit Bio, Experience, Education)"]
        P_ViewProfile["/view_profile/[username] (Scouting Card, PDF)"]
        P_Connections["/my_connections (Network Hub & Requests)"]
        P_Teams["/teams (Squads, Autocomplete, Chat)"]
        P_Events["/events & /events/[eventId] (Tournaments, Scoring, Photos)"]
    end

    App --> UserLayout
    UserLayout --> NavComp
    UserLayout --> P_Dash
    UserLayout --> P_Profile
    UserLayout --> P_ViewProfile
    UserLayout --> P_Connections
    UserLayout --> P_Teams
    UserLayout --> P_Events
```

---

### 3.3 Backend Controller & Routing Design

```mermaid
graph LR
    subgraph Express_Server ["Express Server (server.js)"]
        Middlewares["Middleware Pipeline<br/>- CORS<br/>- express.json()<br/>- /uploads Static Hosting"]
    end

    subgraph Routes ["Route Dispatchers"]
        R_User["/user.routes.js"]
        R_Post["/posts.routes.js"]
        R_Team["/team.routes.js"]
        R_Event["/sportEvent.routes.js"]
    end

    subgraph Handlers ["Controller Modules"]
        C_User["user.controller.js<br/>- 23 Handlers (Auth, Profile, Connections, Notifications, PDF)"]
        C_Post["posts.controller.js<br/>- 8 Handlers (Create, Delete, Likes, Comments)"]
        C_Team["team.controller.js & teamMessage.controller.js<br/>- 9 Handlers (Squads, Invites, Approvals, Chat)"]
        C_Event["sportEvent.controller.js<br/>- 10 Handlers (Key Join, Scoring, Standings, Photos)"]
    end

    Middlewares --> R_User --> C_User
    Middlewares --> R_Post --> C_Post
    Middlewares --> R_Team --> C_Team
    Middlewares --> R_Event --> C_Event
```

---

## 4. End-to-End Feature Working Flows

### Flow 1: User Authentication & OAuth System

```mermaid
sequenceDiagram
    autonumber
    actor User as Athlete
    participant UI as Next.js (/login)
    participant Redux as Redux Auth Slice
    participant API as Express Auth Router
    participant OAuth as Google/GitHub OAuth API
    participant DB as MongoDB

    alt Email & Password Login
        User->>UI: Input username & password
        UI->>API: POST /login { username, password }
        API->>DB: User.findOne({ username })
        API->>API: bcrypt.compare(password, user.password)
        API->>DB: User.updateOne({ _id }, { token: crypto.randomBytes(32).toString('hex') })
        API-->>UI: 200 OK + { token, user }
        UI->>Redux: dispatch(loginSuccess(user, token))
        UI-->>User: Redirect to /dashboard
    else Social OAuth (Google / GitHub)
        User->>UI: Click "Sign in with Google" / "Sign in with GitHub"
        UI->>OAuth: Prompt consent dialog
        OAuth-->>UI: Return credential/token
        UI->>API: POST /auth/google_oauth or /auth/github_oauth { token / code }
        API->>OAuth: Verify token & fetch user profile
        API->>DB: Find or create User with provider: 'google' | 'github'
        API->>DB: Ensure 1:1 Profile document exists
        API-->>UI: 200 OK + { token, user }
        UI->>Redux: dispatch(loginSuccess(user, token))
        UI-->>User: Redirect to /dashboard
    end
```

---

### Flow 2: Athlete Scouting Profile & PDF Resume Generation

```mermaid
sequenceDiagram
    autonumber
    actor Scout as Scout / Recruiter
    participant Browser as Browser Client
    participant SSR as Next.js SSR ([username].jsx)
    participant API as Express Backend
    participant PDFKit as PDFKit Document Engine
    participant DB as MongoDB

    Scout->>Browser: Navigate to /view_profile/john_doe
    Browser->>SSR: getServerSideProps({ params: { username: "john_doe" } })
    SSR->>API: GET /user/get_profile_based_on_username?username=john_doe (via serverClient)
    API->>DB: User.findOne({ username }) & Profile.findOne({ userId })
    API->>DB: Post.find({ userId }) & Team.find({ members: userId })
    API-->>SSR: Complete Athlete Profile Payload
    SSR-->>Browser: Hydrated HTML with Scouting Card, Career Timeline, Teams & Posts

    alt Self-Profile Context
        Note over Browser: If logged-in user === profile owner, show "Edit My Profile" button instead of "Connect"
    end

    alt PDF Scouting Resume Export
        Scout->>Browser: Click "Export Athletic Resume (PDF)"
        Browser->>API: GET /user/download_resume?id=userId
        API->>DB: Fetch User & Profile details
        API->>PDFKit: Build styled PDF with Header, Bio, Career Timeline & Education
        PDFKit-->>API: Stream PDF buffer
        API-->>Browser: Return application/pdf with Content-Disposition attachment
        Browser-->>Scout: Trigger native PDF download: John_Doe_Scouting_Resume.pdf
    end
```

---

### Flow 3: Social Feed, Media Posts & Interaction Hub

```mermaid
sequenceDiagram
    autonumber
    actor Athlete as Athlete A
    actor Peer as Athlete B
    participant Dashboard as /dashboard Page
    participant API as Express API (/posts)
    participant Multer as Multer Storage
    participant Notif as Notification Engine
    participant DB as MongoDB

    Athlete->>Dashboard: Create post with text + image/video file
    Dashboard->>API: POST /post (multipart/form-data: token, body, media)
    API->>Multer: Save file to backend/uploads/post-unique.jpg
    API->>DB: Post.create({ userId, body, media, fileType })
    API-->>Dashboard: 200 OK + new post object
    Dashboard->>Dashboard: Prepend post to feed UI

    Note over Peer, DB: Like & Comment Interactions
    Peer->>Dashboard: Click "❤️ Like" on Athlete A's post
    Dashboard->>API: POST /increment_post_like { token, post_id }
    API->>DB: Post.findByIdAndUpdate (add/remove peer userId in likes array)
    API->>Notif: If liked, create Notification { userId: AthleteA, senderId: Peer, type: "like" }
    API-->>Dashboard: 200 OK + updated like count

    Peer->>Dashboard: Submit comment "Great agility drills!"
    Dashboard->>API: POST /comment { token, post_id, commentBody }
    API->>DB: Comment.create({ userId: Peer, postId, body })
    API->>Notif: Create Notification { userId: AthleteA, senderId: Peer, type: "comment" }
    API-->>Dashboard: 200 OK + comment added
```

---

### Flow 4: Athlete Networking & Connection Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor AthleteA as Athlete A (Requester)
    actor AthleteB as Athlete B (Recipient)
    participant UI_A as Network UI (A)
    participant UI_B as Network UI / Navbar (B)
    participant API as Express User API
    participant DB as MongoDB

    AthleteA->>UI_A: Click "Connect" on Athlete B's profile
    UI_A->>API: POST /user/send_connection_request { token, connectionId: B }
    API->>DB: Check existing ConnectionRequest
    API->>DB: ConnectionRequest.create({ userId: A, connectionId: B, status_accepted: null })
    API->>DB: Notification.create({ userId: B, senderId: A, type: "connection_request" })
    API-->>UI_A: 200 OK (Button changes to "⏳ Request Sent")

    Note over UI_B, DB: Recipient receives notification
    UI_B->>API: GET /user/notifications
    API-->>UI_B: Notification list with pending connection request
    UI_B->>UI_B: Render actionable [Accept] & [Decline] buttons in Navbar dropdown

    alt Athlete B Accepts Connection
        AthleteB->>UI_B: Click [Accept]
        UI_B->>API: POST /user/accept_connection_request { token, requestId, action_type: "accept" }
        API->>DB: ConnectionRequest.updateOne({ _id: requestId }, { status_accepted: true })
        API->>DB: Notification.create({ userId: A, senderId: B, message: "Athlete B accepted your connection!" })
        API-->>UI_B: 200 OK
        UI_B->>UI_B: Optimistically change button to "Connected"
    else Athlete B Declines Connection
        AthleteB->>UI_B: Click [Decline]
        UI_B->>API: POST /user/accept_connection_request { token, requestId, action_type: "reject" }
        API->>DB: ConnectionRequest.updateOne({ _id: requestId }, { status_accepted: false })
        API-->>UI_B: 200 OK
        UI_B->>UI_B: Dismiss item from pending list
    end
```

---

### Flow 5: Squads & Teams Management Engine (with Live Chat)

```mermaid
sequenceDiagram
    autonumber
    actor Captain as Team Captain
    actor Member as Athlete / Applicant
    participant SquadUI as /teams Page
    participant API as Team API Gateway
    participant DB as MongoDB

    Note over Captain, DB: Squad Creation
    Captain->>SquadUI: Fill Squad Name, Sport, Max Capacity, Description & Submit
    SquadUI->>API: POST /teams/create { token, name, sport, description, maxSize }
    API->>DB: Team.create({ name, sport, description, creatorId: Captain, members: [Captain] })
    API-->>SquadUI: 201 Created + new Team

    Note over Captain, Member: Smart Autocomplete Search & Direct Invite
    Captain->>SquadUI: Type athlete name in search bar
    SquadUI->>API: GET /user/get_all_users
    SquadUI->>SquadUI: Filter matching candidates
    Captain->>SquadUI: Click [Invite] on Athlete candidate
    SquadUI->>API: POST /teams/invite { token, teamId, userId: Member }
    API->>DB: Notification.create({ userId: Member, senderId: Captain, type: "team_invite", relatedId: teamId })
    API-->>SquadUI: 200 OK (Invite Dispatched)

    Note over Member, Captain: Join Request & Captain Approval Flow
    Member->>SquadUI: Browse squads & click [Request to Join]
    SquadUI->>API: POST /teams/join { token, teamId }
    API->>DB: Notification.create({ userId: Captain, senderId: Member, type: "team_join_request", relatedId: teamId })
    API-->>SquadUI: 200 OK (Button updates to "⏳ Request Pending")

    Captain->>SquadUI: Open Navbar notifications & click [Accept] on team join request
    SquadUI->>API: POST /teams/accept_join { token, teamId, applicantId: Member }
    API->>DB: Team.updateOne({ _id: teamId }, { $addToSet: { members: Member } })
    API->>DB: Notification.create({ userId: Member, senderId: Captain, message: "Accepted into Squad!" })
    API-->>SquadUI: 200 OK (Member added to squad roster)

    Note over Member, DB: Live Squad Chat Room
    Member->>SquadUI: Select active Squad & send message: "Ready for practice!"
    SquadUI->>API: POST /teams/:teamId/messages { token, message }
    API->>DB: TeamMessage.create({ teamId, senderId: Member, message })
    API->>DB: Send Notification to all other squad members (type: "team_message")
    API-->>SquadUI: 201 Created + message object
```

---

### Flow 6: Tournament Hub, Multi-Sport Scoring & Standings

```mermaid
sequenceDiagram
    autonumber
    actor Host as Tournament Host
    actor Follower as Team / Follower
    participant EventUI as /events & /events/[eventId]
    participant API as Sport Event Controller
    participant DB as MongoDB

    Note over Host, DB: 1. Host Creates Multi-Sport Tournament
    Host->>EventUI: Define Name, Date Range, Sports (advanceCount: Top 2/4) & Cover Image
    EventUI->>API: POST /events (multipart/form-data with coverImage)
    API->>API: Generate 8-character uppercase unique EventKey (e.g., 'GOLD2024')
    API->>DB: SportEvent.create({ name, hostId, sports, eventKey, coverImage })
    API-->>EventUI: 201 Created + Event Object

    Note over Follower, DB: 2. Joining Tournament via Secret 8-Character Event Key
    Follower->>EventUI: Click "Join by Key", enter "GOLD2024"
    EventUI->>API: POST /events/join { token, eventKey: "GOLD2024" }
    API->>DB: SportEvent.findOneAndUpdate({ eventKey }, { $addToSet: { followers: userId } })
    API-->>EventUI: 200 OK + Joined Event Details

    Note over Host, DB: 3. Match Scheduling & Sport-Aware Scoring
    Host->>EventUI: Schedule Match (e.g., Football: Tigers vs Lions)
    EventUI->>API: POST /events/:eventId/matches { homeTeam, awayTeam, sport, round }
    API->>DB: EventMatch.create({ eventId, homeTeam, awayTeam, status: 'scheduled' })
    API-->>EventUI: 201 Created

    Host->>EventUI: Update Live Score (Football: 2 - 1, Period: '2nd Half')
    EventUI->>API: POST /events/:eventId/matches/:matchId/score { homeScore, awayScore, period, status: 'completed' }
    API->>DB: EventMatch.findByIdAndUpdate(matchId, { homeScore: 2, awayScore: 1, status: 'completed', winner: 'Tigers' })
    
    Note over API, DB: Auto Standings Recalculation Engine
    API->>API: Query all completed matches for this sport in event
    API->>API: Recalculate { played, won, lost, drawn, goalsFor, goalsAgainst, points } for each team
    API->>DB: SportEvent.updateOne({ _id: eventId }, { 'sports.$.standings': updatedStandings })
    API-->>EventUI: 200 OK + Updated Standings & Bracket

    Note over Host, Follower: 4. Tournament Photo Gallery Feed
    Host->>EventUI: Upload trophy celebration photo
    EventUI->>API: POST /events/:eventId/photos (multipart media)
    API->>DB: EventPhoto.create({ eventId, hostId, media, caption })
    API-->>EventUI: 201 Created (Instant photo display)
    Follower->>EventUI: Click Like on Tournament Photo
    EventUI->>API: POST /events/:eventId/photos/:photoId/like { token }
    API->>DB: EventPhoto.updateOne({ _id: photoId }, toggle like user ID)
    API-->>EventUI: 200 OK
```

---

### Flow 7: Actionable Real-Time Notification Engine

```mermaid
stateDiagram-v2
    [*] --> EventTriggered: Action Occurs (Invite, Request, Like, Comment, Chat)
    EventTriggered --> NotificationCreated: Notification.create({ userId, senderId, type, relatedId })
    NotificationCreated --> NavbarPollingOrFetch: Frontend Navbar queries /user/notifications
    NavbarPollingOrFetch --> RenderDropdown: Popover displays unread badges & notification list

    state RenderDropdown {
        [*] --> CheckType
        CheckType --> ActionableItem: Type is 'team_invite', 'team_join_request', or 'connection_request'
        CheckType --> InformationalItem: Type is 'like', 'comment', 'team_message'
        
        ActionableItem --> PendingState: Render [Accept] and [Decline] buttons
        PendingState --> HandledState: User clicks [Accept] or [Decline]
        HandledState --> OptimisticUpdate: Execute Action API + update button to 'Accepted' / 'Declined'
    }

    RenderDropdown --> MarkAsRead: User opens dropdown / triggers /user/notifications/mark_read
    MarkAsRead --> [*]: isRead = true
```

---

## 5. Complete API Specification Summary

### 🔐 Authentication & Profile (`/user.routes.js`)
- `POST /auth/send-otp` — Generate and email 5-minute cryptographic OTP.
- `POST /auth/register` — Verify OTP & create athlete account with hashed credentials.
- `POST /auth/login` — Authenticate and issue 256-bit crypto session token.
- `POST /auth/reset-password` — Verify password reset OTP and update password.
- `POST /auth/google_oauth` & `POST /auth/github_oauth` — OAuth token exchange and athlete profile synchronization.
- `GET /get_user_and_profile` — Fetch user account + 1:1 sports profile.
- `POST /update_profile_data` — Update bio, past sports clubs, and education timeline.
- `POST /update_profile_picture` — Multipart avatar upload via Multer.
- `GET /user/get_profile_based_on_username` — Public profile resolver with populate for scouting view.
- `GET /user/download_resume` — Stream generated PDFKit athlete resume.

### 🌐 Networking & Notifications (`/user.routes.js`)
- `POST /user/send_connection_request` — Send athlete connection invitation.
- `POST /user/accept_connection_request` — Accept or decline pending connection request.
- `GET /user/getConnectionRequests` — List pending incoming connection requests.
- `GET /user/user_connection_requests` — List user's active connection roster.
- `GET /user/notifications` — Fetch user's notification list.
- `POST /user/notifications/mark_read` — Mark notifications as read.
- `GET /user/trending_athletes` — Fetch top active athletes with highest connection counts.
- `GET /user/stats` — Fetch count of connections, posts, and teams for dashboard metrics.

### 📱 Social Feed & Comments (`/posts.routes.js`)
- `POST /post` — Create new post with optional image/video media.
- `GET /posts` — Fetch global chronologically ordered social feed with user profiles populated.
- `POST /delete_post` — Delete post created by user.
- `POST /increment_post_like` — Toggle like status on post & trigger notification.
- `POST /comment` — Add comment to post & trigger notification to post owner.
- `GET /get_comments` — Fetch comments for a specific post.
- `DELETE /delete_comment` — Remove comment by author.

### 👥 Squads & Teams (`/team.routes.js`)
- `GET /teams` — List all sports teams with members and captain details.
- `POST /teams/create` — Create a new squad with sport tag and maximum roster size.
- `POST /teams/join` — Submit join request to squad captain.
- `POST /teams/accept_join` — Squad captain approval of incoming athlete request.
- `POST /teams/reject_join` — Squad captain rejection of athlete request.
- `POST /teams/invite` — Captain sends direct invite to an athlete.
- `POST /teams/accept_invite` — Athlete accepts squad invitation.
- `POST /teams/leave` — Athlete leaves a squad.
- `GET /teams/user/:userId` — Fetch all squads a specific athlete belongs to.
- `GET /teams/:teamId/messages` — Fetch chat message history for a squad.
- `POST /teams/:teamId/messages` — Send squad message & notify all squad members.

### 🏆 Tournaments & Sports Events (`/sportEvent.routes.js`)
- `GET /events` — List all sports events and tournaments.
- `POST /events` — Create event with sports categories, advancement count, and cover image.
- `POST /events/join` — Join tournament as follower using unique 8-character Event Key.
- `GET /events/:eventId` — Retrieve tournament details, teams, sports, and followers.
- `POST /events/:eventId/teams` — Add team to a sport category in the tournament.
- `GET /events/:eventId/matches` — Fetch all scheduled/live/completed matches for an event.
- `POST /events/:eventId/matches` — Host schedules a match between two teams.
- `POST /events/:eventId/matches/:matchId/score` — Update live match score & auto-recalculate standings.
- `GET /events/:eventId/photos` — Fetch tournament photo feed.
- `POST /events/:eventId/photos` — Upload tournament photo with caption.
- `POST /events/:eventId/photos/:photoId/like` — Toggle like on tournament photo.
