Cerus - Project Management Web Application
A secure, enterprise-grade serverless project management web application built with Vanilla JavaScript, HTML, and CSS. It features client-side data persistence via Local Storage, advanced task timelines, resource allocation, and a cloud-native AWS deployment architecture.

Features
Multi-Step Authentication: Secure user sign-in and account creation with validation and profile management.

Dynamic Dashboard: Real-time tracking of project metrics, active workers, labor costs, and team allocations.

Timeline & Gantt Visualizer: Interactive task management, milestone tracking, and dynamic timeline generation.

Resource & Team Management: Assemble teams, assign roles, define custom working hours, and set calendar exceptions.

Project Analysis: Built-in visual charts for tracking project trends, budget distributions, and task metrics.

Tech Stack
Frontend: HTML5, Modern CSS3, JavaScript (ES6+)

Data Persistence: Browser Local Storage

Charting: Chart.js

AWS Deployment Architecture
This project is deployed using a secure, serverless cloud architecture designed for high availability and zero infrastructure management overhead:

User Request ──► Amazon S3 (Static Website Hosting + Bucket Versioning)
                         │
                         ▼
                 Amazon CloudWatch & SNS (Billing Alerts & Monitoring)
                         │
                         ▼
                 AWS CloudTrail (Security Auditing & API Logs)
Amazon S3 (Simple Storage Service): Acts as the primary web server using Static Website Hosting with custom bucket policies for secure public asset delivery.

S3 Bucket Versioning: Enabled to provide instant disaster recovery and rollback capabilities.

AWS CloudTrail: Configured to monitor, track, and log all account-level API activity and infrastructure modifications.

Amazon CloudWatch & Amazon SNS: Setup for observability and cost governance, utilizing SNS topic subscriptions to trigger automated email alerts for billing thresholds.
