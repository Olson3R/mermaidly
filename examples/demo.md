# Mermaidly Demo

Test file for the Mermaidly VS Code extension.

## Flowchart

```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[Check logs]
    E --> F[Fix issue]
    F --> B
    C --> G[Deploy]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant App
    participant API

    User->>App: Click button
    App->>API: Send request
    API-->>App: Response
    App-->>User: Show result
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Review: Submit
    Review --> Approved: Approve
    Review --> Draft: Request changes
    Approved --> Published: Publish
    Published --> [*]
```

## Pie Chart

```mermaid
pie showData
    title Usage
    "Feature A" : 45
    "Feature B" : 30
    "Feature C" : 25
```

## Class Diagram

```mermaid
classDiagram
    class Animal {
        +String name
        +makeSound()
    }
    class Dog {
        +bark()
    }
    class Cat {
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat
```

## Usage

- **Scroll wheel** - Zoom in/out
- **Click and drag** - Pan around
- **Double-click** - Reset view
- **Buttons** - Zoom controls
