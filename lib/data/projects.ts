import { Project } from "@/lib/types";

const GH_PAGES = "https://aysesule2405.github.io/ayse-sule-ekiz-portfolio";

export const projects: Project[] = [
  {
    slug: "obi",
    title: "Obi — Local AI Desktop Assistant",
    shortName: "Obi",
    oneLiner:
      "A local-first AI assistant that finds the file you half-remember, and shows its work.",
    categories: ["ai-trust", "data-clarity"],
    primaryCategory: "ai-trust",
    description:
      "A local-first AI desktop assistant that indexes files in real time and answers questions through hybrid keyword and semantic retrieval — without sending anything to the cloud.",
    users: "People who need to retrieve scattered personal files and context.",
    role: "Product design, AI prototyping, frontend implementation.",
    keyDecision:
      "Make trust visible by keeping files on-device and designing retrieval around user confidence, not just answer speed.",
    outcome: "LA Hacks 2026 · Figma Make Challenge Winner",
    tools: [
      "Figma",
      "Electron",
      "React",
      "TypeScript",
      "Vite",
      "SQLite",
      "sqlite-vec",
      "Gemma",
      "llama.cpp",
      "Nomic Embed v2",
      "CLIP",
      "chokidar",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/LAHacks2026/Obi_Laptop" },
      { label: "Devpost", href: "https://devpost.com/software/obi-mise-en-place-for-your-data" },
      { label: "Figma Make", href: "https://sadly-camp-78163766.figma.site" },
    ],
    glyph: "retrieval-nodes",
    fieldNumber: "FS-01",
    date: "2026-04",
    dateLabel: "Apr 2026",
    images: [
      { src: `${GH_PAGES}/projects/Obi/homepage.png`, alt: "Obi desktop app homepage" },
      { src: `${GH_PAGES}/projects/Obi/chat_search.png`, alt: "Obi chat and search interface" },
    ],
    decisionLog: [
      {
        decision: "Everything indexes and answers on-device, with no default cloud call.",
        why: "The people who most needed this tool — the ones with years of scattered notes, screenshots, and half-named PDFs — were also the ones least willing to upload that mess to a third party.",
        tradeoff: "We gave up the easy horsepower of a hosted large model and took on the harder job of running retrieval and generation locally on modest hardware, in 36 hours.",
        result: "Trust became a property of the architecture, not a line in a privacy policy — and it was the detail every early tester mentioned first.",
      },
      {
        decision: "Pair keyword search with semantic (vector) search via sqlite-vec instead of choosing one.",
        why: "Keyword-only search misses a file you describe by meaning; semantic-only search misses the exact filename or acronym you know is right there.",
        tradeoff: "Hybrid retrieval is more work to tune — the two signals disagree, and the ranking logic has to decide when to trust which one.",
        result: "Recall improved on both \"fuzzy memory\" queries and exact-term queries, which is what let us call the assistant genuinely file-aware rather than a chatbot with a search plugin bolted on.",
      },
      {
        decision: "Show the source passages behind every answer, not just the answer.",
        why: "An assistant that asserts things about your own files without pointing to them is asking for blind trust — which is exactly what local-first users were trying to avoid.",
        tradeoff: "Surfacing sources adds visual weight to every response and forced us to design a compact way to preview a source without leaving the conversation.",
        result: "Testers stopped asking \"how do you know that\" and started scanning the source chip instead — the question got answered before it was asked.",
      },
      {
        decision: "Index files continuously via chokidar rather than on manual refresh.",
        why: "A stale index breaks the exact trust the tool is built on — if the assistant misses a file you added an hour ago, it undermines every other guarantee.",
        tradeoff: "Continuous indexing meant budgeting CPU carefully so the app never felt like it was competing with the rest of the user's machine.",
        result: "The index stayed current without a visible indexing state most of the time, so the assistant felt reliably \"aware\" rather than periodically catching up.",
      },
    ],
    evidenceRail: {
      users: "Individuals with large, disorganized personal file libraries — notes, PDFs, screenshots, project folders.",
      timeline: "Built for LA Hacks 2026 in 36 hours.",
      role: "Product design, AI prototyping, frontend implementation.",
      tools: ["Figma", "Electron", "React", "TypeScript", "Vite", "SQLite", "sqlite-vec", "Gemma", "llama.cpp"],
      constraints: "On-device only, modest consumer hardware, a 36-hour build window, no cloud inference fallback.",
      outcome: "Won the Figma Make Challenge at LA Hacks 2026.",
    },
    caseStudy: {
      messyProblem:
        "Most people don't have a filing system — they have a search bar and a vague memory. \"The PDF from that professor, sometime last spring, about attention mechanisms\" is a real query, and most file systems have no answer for it. Cloud AI assistants can answer it, but only if you're willing to upload your entire personal archive to someone else's server first.",
      whyItMattered:
        "The tension between capability and trust is the whole reason local AI tools exist. If Obi couldn't credibly promise \"this never leaves your machine,\" it wasn't solving a different problem than ChatGPT with file upload — it was just a slower version of the same thing.",
      northStar:
        "Does this make the user more confident in what the assistant just told them, or less?",
      whoIDesignedFor:
        "People with genuinely messy digital lives — students, researchers, freelancers — who wanted the convenience of an AI assistant but were specifically the type to hesitate before uploading personal files to a cloud service.",
      constraints:
        "Everything had to run locally on consumer hardware within a 36-hour hackathon build, using a quantized open-weight model (Gemma via llama.cpp) small enough to run without a dedicated GPU. There was no cloud fallback to lean on when local inference felt slow.",
      role:
        "I owned the product direction and interface design in Figma, prototyped the retrieval and trust-signaling patterns, and built the frontend in React and TypeScript inside the Electron shell.",
      research:
        "We tested the assistant against our own messy folders first — the fastest way to find where hybrid retrieval broke was to ask it questions we already knew the answers to and see where it hesitated or hallucinated a source.",
      productDecisionsIntro:
        "Every interface decision in Obi traces back to one question: does this make the user more confident in what the assistant just told them, or less? The decision log below covers the four calls that mattered most.",
      designExplorations:
        "Early versions surfaced a single \"confidence score\" percentage next to each answer, which tested badly — it asked users to trust a number instead of giving them something to verify. We replaced it with visible source chips linking back to the actual passage, which let people check the assistant's work in seconds instead of taking its word for it.",
      systemOverview:
        "A chokidar file watcher feeds new and changed documents into a chunking and embedding pipeline (Nomic Embed v2 for text, CLIP for image context) backed by sqlite-vec, alongside a traditional keyword index. Queries run against both, and a lightweight ranking layer merges the results before a quantized Gemma model, run through llama.cpp, generates a grounded response with citations back to the source chunks.",
      finalExperience:
        "You ask Obi a question the way you'd ask a person who organized your files for you. It answers in plain language, and under the answer sits a row of source chips — click one and the original passage opens, highlighted, so you can verify the claim in one motion instead of trusting it blind.",
      whatShipped:
        "A working Electron desktop app, built in 36 hours, with real-time file indexing, hybrid keyword and semantic retrieval, and a chat interface that always shows its sources — running entirely offline on a local quantized model.",
      outcome:
        "Obi won the Figma Make Challenge at LA Hacks 2026, and more specifically, judges and testers consistently called out the source-transparency pattern as the thing that made it feel different from a generic RAG demo.",
      whatILearned:
        "Trust in AI products isn't a single feature — it's the sum of dozens of small legibility decisions, and the ones that matter most are usually the least flashy. A visible source chip did more for user confidence than any amount of model tuning.",
      whatIdImproveNext:
        "I'd design a lightweight way for users to correct or flag a bad retrieval, so the system could learn from real usage instead of relying entirely on the initial ranking logic — right now, if the hybrid search ranks the wrong passage first, there's no path for the user to teach it otherwise.",
    },
    stats: [
      { value: "36 hrs", label: "Hackathon build, start to ship" },
      { value: "Winner", label: "Figma Make Challenge — LA Hacks 2026" },
    ],
  },
  {
    slug: "framewise",
    title: "Framewise — AI Video Workspace + Chrome Extension",
    shortName: "Framewise",
    oneLiner:
      "Turns a video you're watching into something you can question, quiz yourself on, and practice against.",
    categories: ["learning-workflows", "ai-trust"],
    primaryCategory: "learning-workflows",
    description:
      "A connected React web app and Chrome extension that turns videos into searchable, conversational, captioned, and practice-ready workspaces — Gemini analysis, timelines, quizzes, notes, and MoveNet pose tracking for dance practice.",
    users: "Students, self-directed learners, and dancers or other practice-based learners.",
    role: "Interaction design, full-stack development, Chrome extension design.",
    keyDecision:
      "Turn passive video watching into active learning by anchoring every AI interaction to a specific timestamp, not a whole video.",
    outcome: "HackHCC: Code Runners · Best Use of AI + Best Use of MongoDB Atlas",
    tools: [
      "React",
      "Node.js",
      "Express",
      "Chrome MV3",
      "Gemini 2.5",
      "MongoDB Atlas",
      "ElevenLabs",
      "Keras (BiLSTM)",
      "MediaPipe",
      "TensorFlow.js",
      "MoveNet",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/aysesule2405/framewise" },
      { label: "Devpost", href: "https://devpost.com/software/framwise" },
    ],
    glyph: "waveform-notes",
    fieldNumber: "FS-02",
    date: "2026-05",
    dateLabel: "May 2026",
    images: [
      { src: `${GH_PAGES}/projects/Framewise/framewise%20photos.001.jpeg`, alt: "Framewise workspace overview" },
      { src: `${GH_PAGES}/projects/Framewise/framewise%20photos.005.jpeg`, alt: "Framewise timestamped chat and notes" },
      { src: `${GH_PAGES}/projects/Framewise/framewise%20photos.008.jpeg`, alt: "Framewise pose-tracking practice mode" },
    ],
    decisionLog: [
      {
        decision: "Anchor every AI answer, note, and quiz question to an exact timestamp.",
        why: "\"Explain this video\" is a weak question because it has no scope. \"Explain what happens at 4:32\" is a question with an answer you can immediately verify by scrubbing there.",
        tradeoff: "Timestamp-anchoring meant building a transcript-and-frame indexing layer instead of just piping the whole video into a prompt, which was a heavier lift for a hackathon build.",
        result: "Q&A answers became checkable against the actual video moment, which made the AI feel like a study partner pointing at the screen rather than a black box summarizing it.",
      },
      {
        decision: "Auto-generate quiz questions from the video content instead of requiring manual authoring.",
        why: "Learners rarely go back and write their own practice questions — the friction of authoring kills the habit before it starts.",
        tradeoff: "Auto-generated questions needed a review pass in the UI so a learner could skip a bad or irrelevant question without losing trust in the whole quiz.",
        result: "Turning any video into a quiz in one click was the feature that made testers say Framewise felt like a study tool, not just a note-taking extension.",
      },
      {
        decision: "Train a dedicated Keras BiLSTM on MediaPipe pose landmarks instead of reusing MoveNet's raw output directly.",
        why: "Raw pose keypoints tell you where a body is, not what a movement means — dance practice needed a model that understood sequences, not single frames.",
        tradeoff: "Training and quantizing a classifier (int8, exported to TensorFlow.js) added real ML engineering scope to an already packed hackathon build.",
        result: "Pose feedback ran fully on-device in the browser, fast enough for real-time practice, with no server round-trip per frame.",
      },
      {
        decision: "Ship as a Chrome extension (MV3) rather than a standalone player.",
        why: "The video people actually want to learn from already lives on YouTube and course platforms — asking them to re-upload it into a separate app is a non-starter.",
        tradeoff: "Building against MV3's constraints, and against pages we don't control, meant more defensive engineering around where and how the workspace UI could inject itself.",
        result: "Framewise could sit directly on top of a video someone was already watching, which removed the biggest adoption barrier a standalone tool would have had.",
      },
    ],
    evidenceRail: {
      users: "Students, self-directed learners, and practice-based learners like dancers reviewing form.",
      timeline: "Built for HackHCC: Code Runners over one hackathon weekend.",
      role: "Interaction design, full-stack development, Chrome extension design.",
      tools: ["React", "Node.js", "Express", "Chrome MV3", "Gemini 2.5", "MongoDB Atlas", "TensorFlow.js", "MoveNet"],
      constraints: "Hackathon timeline, MV3 extension sandboxing, needed to work on video platforms we don't control.",
      outcome: "Won Best Use of AI and Best Use of MongoDB Atlas at HackHCC: Code Runners.",
    },
    caseStudy: {
      messyProblem:
        "Video is one of the richest ways to learn something, and one of the worst formats to study from. You can't search it, you can't quiz yourself on it, and going back to \"the part where they explained it\" means scrubbing a timeline by memory.",
      whyItMattered:
        "Learners already spend hours watching lecture recordings, tutorials, and practice clips — the content isn't the gap, the retrieval and practice layer on top of it is. Fixing that layer had leverage far beyond any single video.",
      northStar:
        "Does this ask the learner to do a little work, right at the moment the video just gave them a reason to?",
      whoIDesignedFor:
        "Two learner types that turned out to want the same underlying tool: students reviewing recorded lectures who needed searchable, quizzable notes, and practice-based learners like dancers who needed feedback on their own movement against a reference video.",
      constraints:
        "A single hackathon weekend, the sandboxing rules of Chrome's Manifest V3, and the reality that we didn't control the video platforms we were building on top of.",
      role:
        "I led interaction design across the extension and the workspace, and built full-stack — the React interface, the Node/Express backend, and the Chrome extension packaging.",
      research:
        "We treated our own study habits as the first data point: what would make us actually go back and review a lecture instead of letting it sit in a watch-later list. Timestamped, checkable answers kept surfacing as the missing piece.",
      productDecisionsIntro:
        "Framewise's design choices all point at the same goal: replace passive watching with something that asks the learner to do a little work, at the exact moment the video gives them a reason to.",
      designExplorations:
        "We initially prototyped a single AI chat panel next to the video, with no timestamp binding — it answered fine, but users had no way to check the answer against the video without hunting for the relevant moment themselves. Binding every response to a clickable timestamp fixed that in one interaction change.",
      systemOverview:
        "The Chrome extension injects a workspace panel alongside supported video players (YouTube, Shorts, Vimeo, TikTok, Canvas/Kaltura, and generic video elements). Transcripts and frame data are indexed and stored in MongoDB Atlas; Gemini 2.5 generates timestamp-anchored Q&A and quiz content from that index, while a Keras BiLSTM trained on MediaPipe pose landmarks — quantized to int8 and exported to TensorFlow.js — drives real-time, on-device pose feedback for the movement-practice mode.",
      finalExperience:
        "You watch a video with a workspace panel open beside it. Ask a question and the answer comes back linked to the exact moment it's drawn from; take notes and they save with a timestamp attached; generate a quiz and each question can jump you back to its source clip. Switch to practice mode and your own webcam feed overlays pose tracking against the reference video, mirrored, looped, and speed-adjustable.",
      whatShipped:
        "A working Chrome MV3 extension with a React-based workspace panel, Gemini-powered timestamped Q&A and quiz generation, a captions pipeline, note-taking bound to video moments, and an on-device MoveNet/TensorFlow.js pose-tracking practice mode, backed by MongoDB Atlas.",
      outcome:
        "Framewise won Best Use of AI and Best Use of MongoDB Atlas at HackHCC: Code Runners, and the timestamp-anchoring pattern was the specific thing judges called out as differentiating it from a generic \"chat with your video\" tool.",
      whatILearned:
        "The unit of design for AI-assisted learning isn't the whole video — it's the moment. Every feature that got anchored to a specific timestamp felt trustworthy and useful; every feature that operated on \"the video\" as a whole felt vague, no matter how good the underlying model was.",
      whatIdImproveNext:
        "I'd extend the pose-tracking pipeline into systematically labeled movement-sequence datasets and temporal features, so recurring movement patterns could be classified more precisely than the current single-session feedback loop allows.",
    },
    stats: [
      { value: "6", label: "Video platforms supported" },
      { value: "2 awards", label: "Best Use of AI + Best Use of MongoDB Atlas" },
    ],
  },
  {
    slug: "openstax-align",
    title: "OpenStaxAlign",
    shortName: "OpenStaxAlign",
    oneLiner:
      "Turns a model's raw classification output into a curriculum story an educator can actually use.",
    categories: ["data-clarity", "learning-workflows"],
    primaryCategory: "data-clarity",
    description:
      "An end-to-end ML classification pipeline for curriculum alignment — TF-IDF plus a class-weighted Linear SVM, reaching 75% validation accuracy — that translates raw model output into a curriculum story educators can act on.",
    users: "Educators, curriculum reviewers, and datathon judges and stakeholders.",
    role: "Data visualization, ML diagnostics, product storytelling.",
    keyDecision:
      "Make model behavior understandable through diagnostics and clearer output interpretation, instead of presenting raw classification scores.",
    outcome: "Rice Datathon 2026 · OpenStax Track Winner, 2nd Place Overall",
    tools: [
      "Python",
      "scikit-learn",
      "TF-IDF",
      "Logistic Regression",
      "Linear SVM",
      "MongoDB",
      "Stratified cross-validation",
      "Confusion-matrix analysis",
    ],
    links: [
      { label: "Team GitHub", href: "https://github.com/iremdmrc/datathon-openstax" },
      { label: "Devpost", href: "https://devpost.com/software/openstaxalign" },
    ],
    glyph: "diagnostic-scatter",
    fieldNumber: "FS-03",
    date: "2026-01",
    dateLabel: "Jan 2026",
    images: [
      { src: `${GH_PAGES}/projects/OpenStaxAlign/bg.png`, alt: "OpenStaxAlign presentation background graphic" },
      { src: `${GH_PAGES}/projects/OpenStaxAlign/logo.png`, alt: "OpenStaxAlign project logo" },
    ],
    decisionLog: [
      {
        decision: "Preserve hierarchical document context in feature extraction, instead of flat text extraction.",
        why: "Curriculum sections carry meaning from where they sit in a textbook's structure, not just their raw text — flat extraction was the first approach tried, and it underperformed significantly.",
        tradeoff: "Structured feature extraction took more of the single hackathon day than a naive TF-IDF pass would have, with less time left for model tuning.",
        result: "This was the single biggest accuracy lever in the whole pipeline — more than any classifier swap.",
      },
      {
        decision: "Build a diagnostic layer (precision/recall, confusion-matrix analysis) on top of the classifier, not just an accuracy score.",
        why: "A single accuracy number tells a judge the model works, but tells an educator nothing about where it's likely to be wrong for their specific curriculum.",
        tradeoff: "Diagnostics took time away from squeezing out marginal accuracy gains on the core TF-IDF and Linear SVM pipeline, in a datathon where the model itself was also being judged.",
        result: "The presentation could show exactly which curriculum categories the model struggled with and why, which is what separated it from a pure leaderboard-accuracy submission.",
      },
      {
        decision: "Filter rare standards and tune class weights instead of leaving severe class imbalance unaddressed.",
        why: "A large, imbalanced label space meant a naive classifier could look accurate overall while being useless on the standards that actually needed alignment help.",
        tradeoff: "Filtering rare classes meant the reported accuracy applies to a curated label set, not literally every possible standard in the raw dataset.",
        result: "75% multi-class validation accuracy on the standards that mattered, with the tradeoff disclosed rather than hidden.",
      },
      {
        decision: "Design MongoDB analytics views that read as a curriculum story, not a query interface.",
        why: "Educators evaluating curriculum alignment don't think in probability scores — they think in terms of \"this matches\" or \"this needs review.\"",
        tradeoff: "Building an interpretable analytics layer meant less time polishing the raw classifier under a one-day time limit.",
        result: "Non-technical judges and stakeholders could interpret the output correctly without a data science background — the actual deliverable of a curriculum-alignment tool.",
      },
    ],
    evidenceRail: {
      users: "Educators, curriculum reviewers, and datathon judges evaluating the submission.",
      timeline: "Built in a single day at Rice Datathon 2026, as part of a team.",
      role: "Data visualization, ML diagnostics, product storytelling.",
      tools: ["Python", "scikit-learn", "TF-IDF", "Logistic Regression", "Linear SVM", "MongoDB"],
      constraints: "One-day datathon limit, API rate limits, real OpenStax curriculum data, severe class imbalance.",
      outcome: "Won the OpenStax Track and placed 2nd Overall at Rice Datathon 2026.",
    },
    caseStudy: {
      messyProblem:
        "Curriculum alignment — deciding whether a piece of content actually matches the standard it's tagged against — produces a lot of ambiguous middle ground, and manually mapping textbook sections to standards is hours of work per document.",
      whyItMattered:
        "OpenStax's actual use case wasn't \"build an accurate classifier\" in isolation — it was giving curriculum teams a usable way to audit alignment at scale, which meant the interpretation layer mattered as much as the model's accuracy.",
      northStar:
        "Would a curriculum reviewer trust this enough to act on it, without needing a data science background to read it?",
      whoIDesignedFor:
        "Educators and curriculum reviewers who needed to trust and act on the model's output, and datathon judges who needed to evaluate both the technical approach and its practical usability in a short presentation window.",
      constraints:
        "A single hackathon day, API rate-limit constraints, a need to keep the underlying model interpretable rather than opaque, and real OpenStax curriculum data with severe class imbalance and genuinely ambiguous edge cases. This was a team project — the pipeline's GitHub repository belongs to a teammate.",
      role:
        "I focused on data visualization, diagnosing where and why the classification pipeline struggled, and shaping how the team presented model behavior as a coherent product story rather than a set of metrics.",
      research:
        "I dug into the misclassified cases directly, sorting them by pattern rather than treating each as an isolated error, to see whether the model was failing randomly or failing in a way that pointed to real ambiguity in the curriculum taxonomy.",
      productDecisionsIntro:
        "The team's technical work centered on a JSON-ingestion-to-Linear-SVM pipeline; my job was making sure that pipeline's behavior could be understood and trusted by someone who'd never look at a confusion matrix.",
      designExplorations:
        "We tried presenting results as a straightforward accuracy percentage first, which felt technically honest but told judges nothing about practical reliability. Shifting to a visualized diagnostic view of where errors clustered gave the same information a narrative — and made the model's limitations feel like a documented, understood property rather than a hidden flaw.",
      systemOverview:
        "Raw JSON curriculum data is ingested, vectorized with TF-IDF while preserving hierarchical document context, and classified with a class-weighted Linear SVM (benchmarked against a Logistic Regression baseline) validated with stratified cross-validation. Results and metadata are stored in MongoDB, with analytics views that cluster misclassifications by curriculum category to surface systematic patterns rather than isolated errors.",
      finalExperience:
        "Instead of a spreadsheet of predictions and confidence scores, the output reads as a curriculum map: which areas align cleanly, which sit in a genuinely ambiguous zone, and where the taxonomy itself might need a second look — presented in language a curriculum reviewer, not just a data scientist, could act on.",
      whatShipped:
        "A complete pipeline — raw JSON ingestion, TF-IDF vectorization preserving document hierarchy, class-weighted Linear SVM, stratified cross-validation — reaching 75% multi-class validation accuracy, with a diagnostic visualization layer translating model confidence into plain-language alignment guidance.",
      outcome:
        "The project won the OpenStax Track and placed 2nd Overall at Rice Datathon 2026, with judges specifically responding to the clarity of the diagnostic presentation alongside the model's 75% accuracy.",
      whatILearned:
        "In an ML product, the interpretation layer is not a nice-to-have wrapped around \"the real work\" — for a non-technical stakeholder, the interpretation layer is the actual product. The model can be excellent and still fail if nobody can act on what it says.",
      whatIdImproveNext:
        "I'd build a feedback loop where curriculum reviewers could flag a diagnostic finding as right or wrong, so the ambiguous-zone clustering could improve from real reviewer judgment instead of staying fixed at datathon-day accuracy.",
    },
    stats: [
      { value: "75%", label: "Multi-class validation accuracy" },
      { value: "2nd", label: "Place overall — Rice Datathon 2026" },
    ],
  },
  {
    slug: "nau-athletics-student-portal",
    title: "NAU Athletics & Student Portal",
    shortName: "NAU Portal",
    oneLiner:
      "One navigation system, several very different users, and no room to get it wrong in production.",
    categories: ["campus-systems", "design-systems"],
    primaryCategory: "campus-systems",
    description:
      "A live campus platform serving the entire NAU community — schedules, rosters, and team pages for eight sports programs — owned end-to-end from user research through a WCAG 2.1 AA accessibility audit and developer handoff.",
    users: "1,000+ daily campus users, including students, staff, administrators, coaches, and visitors.",
    role: "UX research, product design, accessibility, design systems, developer handoff.",
    keyDecision:
      "Create reusable navigation and content patterns instead of designing separate experiences for every user group.",
    outcome: "Live since Sep 2024 · 1,000+ daily active users",
    tools: [
      "Figma",
      "WordPress",
      "WCAG 2.1 AA",
      "Component Library",
      "UX Research",
      "Journey Mapping",
      "Usability Testing",
      "A/B Testing",
    ],
    links: [{ label: "Live site", href: "https://stallions.na.edu/" }],
    glyph: "nav-grid",
    fieldNumber: "FS-04",
    date: "2024-09",
    dateLabel: "Live since Sep 2024",
    images: [
      { src: `${GH_PAGES}/projects/NAU%20Portal/Dashboard.png`, alt: "NAU Portal dashboard view" },
      { src: `${GH_PAGES}/projects/NAU%20Portal/Statistics.png`, alt: "NAU Portal statistics/analytics view" },
    ],
    decisionLog: [
      {
        decision: "Design one shared navigation and content model, not separate audience-specific portals.",
        why: "A prospective student, a returning staff member, and a game-day visitor all needed different information, but stakeholders kept requesting separate sites — which would have multiplied maintenance and design debt.",
        tradeoff: "A shared system meant longer upfront IA work and more stakeholder alignment meetings to get every group's must-haves reconciled into one structure.",
        result: "One platform now serves every audience, and every future content addition only has to reason about one navigation model, not several.",
      },
      {
        decision: "Build and document a component library before high-fidelity screens.",
        why: "With multiple stakeholders and a live WordPress implementation, undocumented one-off components would have drifted from the design within a month of launch.",
        tradeoff: "Documentation work up front slowed down the visible progress of \"pages designed\" early in the project, which took some explaining to stakeholders expecting fast visual movement.",
        result: "Developer handoff needed far less clarification back-and-forth, and the component set has stayed consistent as new sections were added after launch.",
      },
      {
        decision: "Run usability testing with real students and staff before finalizing navigation labels.",
        why: "Internal stakeholders had strong opinions about what things should be called; those labels didn't always match how actual students searched for the same information.",
        tradeoff: "Testing added a research cycle to the timeline that some stakeholders initially saw as a delay rather than a risk-reduction step.",
        result: "Several navigation labels changed based on direct evidence from testing sessions, catching mismatches before they shipped into a live, high-traffic site.",
      },
      {
        decision: "Treat WCAG 2.1 AA conformance as a design constraint from the first wireframe, not a QA pass at the end.",
        why: "A public university platform serves visitors with a wide range of access needs, and retrofitting accessibility after visual design is locked in is far more expensive than designing for it from the start.",
        tradeoff: "Some visual choices — contrast ratios, interactive target sizes, motion — had to be constrained earlier than a purely visual-first process would have required.",
        result: "The platform passed a full WCAG 2.1 AA accessibility audit across all pages without a late-stage remediation sprint.",
      },
    ],
    evidenceRail: {
      users: "1,000+ daily users across students, staff, administrators, coaches, and visitors.",
      timeline: "Live and in continuous use since September 2024.",
      role: "UX research, product design, accessibility, design systems, developer handoff.",
      tools: ["Figma", "WordPress", "WCAG 2.1 AA", "Component Library", "Usability Testing", "A/B Testing"],
      constraints: "Multiple user groups, one shared navigation surface, an existing WordPress implementation, eight sports programs' worth of content.",
      outcome: "Live daily-use platform serving 1,000+ campus users since September 2024.",
    },
    caseStudy: {
      messyProblem:
        "A university athletics and student portal has to serve a prospective student researching programs, a current student checking a schedule, a staff member updating a roster, a coach posting results, and a visitor buying game tickets — often on the same page, and often at the same time, across eight sports programs.",
      whyItMattered:
        "Get the shared navigation wrong and every one of those groups pays the cost daily, at scale — this wasn't a low-traffic internal tool, it was a public-facing platform for over a thousand daily users the moment it launched.",
      northStar:
        "Would one shared system serve every campus audience better than five bespoke ones?",
      whoIDesignedFor:
        "Students, university staff, athletics administrators, coaches, and general visitors — groups with different goals who needed to coexist inside one information architecture without stepping on each other's needs.",
      constraints:
        "The platform had to be built on an existing WordPress implementation, meet WCAG 2.1 AA accessibility standards, and satisfy multiple institutional stakeholders with sometimes conflicting priorities for what should be most prominent.",
      role:
        "I led UX research and usability testing, designed the product and its navigation system in Figma, built and documented the component library, and worked directly with developers through handoff — as the IT & Systems Associate owning this platform.",
      research:
        "I ran usability sessions and journey mapping with current students and staff to test navigation labels and task flows against how people actually described what they were looking for, rather than how internal stakeholders described it.",
      productDecisionsIntro:
        "The decisions below were less about any single screen and more about the structural bet that one well-documented system would outperform several bespoke ones over the platform's real lifespan.",
      designExplorations:
        "Early stakeholder requests leaned toward separate sub-sites for athletics versus general student services. I prototyped both a split-site version and a unified-navigation version, then used usability testing evidence to show the unified version reduced task time for cross-cutting journeys, like a student-athlete checking both a class schedule and a practice schedule.",
      systemOverview:
        "A documented Figma component library maps directly to WordPress template structures, so navigation, cards, and content blocks stay visually and structurally consistent across every section of the site — covering schedules, rosters, and team pages for all eight sports programs — regardless of which team edits that section.",
      finalExperience:
        "A visitor lands on one coherent site whether they're there for admissions information or game-day tickets. Navigation adapts contextually to the section they're in, but the underlying patterns — cards, wayfinding, content hierarchy — stay recognizable everywhere, so returning users never have to relearn the interface.",
      whatShipped:
        "A live, WCAG 2.1 AA–audited campus platform with a documented component system, covering all eight NAU sports programs and general student services, with ongoing A/B and usability testing built into the operating cadence.",
      outcome:
        "The platform has been in live daily use by more than 1,000 users spanning students, staff, administrators, coaches, and visitors since September 2024, and has absorbed new content sections post-launch without breaking its navigation model.",
      whatILearned:
        "Documentation is a design deliverable, not an afterthought — the component library did more to keep the platform coherent as ownership and content shifted over time than any individual screen design did.",
      whatIdImproveNext:
        "I'd push for an even tighter feedback loop between the ongoing A/B and usability testing and the component library itself, so testing findings turn into documented pattern updates faster than they do today.",
    },
    stats: [
      { value: "1,000+", label: "Daily users, live since Sep 2024" },
      { value: "8", label: "Sports programs covered" },
    ],
  },
  {
    slug: "reverie",
    title: "Reverie",
    shortName: "Reverie",
    oneLiner:
      "A journal that treats a feeling as something you build a space around, not a field you fill in.",
    categories: ["emotional-ux", "creative-tools"],
    primaryCategory: "emotional-ux",
    description:
      "A full-stack mood curation app where you build named emotional spaces from music, imagery, video, and reflection, each with its own color palette and AI prompt field — with a community feed, timeline view, and ambient music player.",
    users: "People seeking creative self-expression and emotional reflection.",
    role: "Product design, emotional UX, full-stack development.",
    keyDecision:
      "Treat mood tracking as atmosphere-building and self-expression, not just data entry.",
    tools: ["Figma", "React", "TypeScript", "Node.js", "Express", "MongoDB Atlas", "Multer", "JWT auth", "bcryptjs"],
    links: [
      { label: "GitHub", href: "https://github.com/aysesule2405/reverie" },
      { label: "Figma", href: "https://record-poppy-86285822.figma.site" },
    ],
    glyph: "mood-atmosphere",
    fieldNumber: "FS-05",
    date: "2025-12",
    dateLabel: "Dec 2025",
    images: [
      { src: `${GH_PAGES}/projects/Reverie/Screenshot%201%20-%20Home%20Screen%201%20copy.png`, alt: "Reverie home screen" },
      { src: `${GH_PAGES}/projects/Reverie/Screenshot%205%20-%20My%20Spaces%20copy.png`, alt: "Reverie named emotional spaces" },
      { src: `${GH_PAGES}/projects/Reverie/Screenshot%206%20-%20Community%20copy.png`, alt: "Reverie community discovery feed" },
      { src: `${GH_PAGES}/projects/Reverie/Screenshot%208%20-%20Timeline%20copy.png`, alt: "Reverie timeline view" },
    ],
    decisionLog: [
      {
        decision: "Build entries as named, multi-sensory spaces — music, imagery, video, color, and an AI prompt field together — instead of a single mood dropdown.",
        why: "A five-point mood scale flattens a feeling into a number; most people don't experience an emotion as a single data point, they experience it as an atmosphere made of several things at once.",
        tradeoff: "A richer entry format meant more interface complexity per entry and a slower initial \"time to first journal\" than a simple mood picker would have had.",
        result: "Entries read back as genuinely evocative later — closer to a memory than a log line — which is the actual value of journaling for reflection over time.",
      },
      {
        decision: "Let color and visual atmosphere emerge from what the user adds, rather than asking them to pick a theme upfront.",
        why: "Asking someone to choose a mood color before they've written anything reverses the emotional order of how reflection actually happens.",
        tradeoff: "Deriving atmosphere from content instead of an upfront selector meant more design and engineering work to make that derivation feel intentional rather than random.",
        result: "The visual tone of an entry felt earned by what was actually written and chosen, not assigned by a generic preset.",
      },
      {
        decision: "Add a community discovery feed and timeline view, but keep spaces private by default.",
        why: "Some reflection wants an audience eventually, but none of it should be public by accident — the default has to protect the vulnerable, unfinished version of a thought.",
        tradeoff: "Building both a private-by-default authoring flow and a separate public discovery surface roughly doubled the surface area of the app versus a purely private journal.",
        result: "The product could support both solitary reflection and optional public sharing without either one compromising the other.",
      },
      {
        decision: "Design privacy as a felt experience, not just an account setting.",
        why: "Emotional journaling only works if the person writing genuinely believes no one else is reading it — a settings toggle buried in a menu doesn't create that feeling in the moment of writing.",
        tradeoff: "This meant investing design time in the private, in-the-moment writing experience rather than only in the shareable/social features.",
        result: "The product stayed honest to its actual use case — private reflection first, community second — instead of drifting toward performative sharing by default.",
      },
    ],
    evidenceRail: {
      users: "People using journaling as a tool for creative self-expression and emotional reflection.",
      timeline: "Independent full-stack build, December 2025.",
      role: "Product design, emotional UX, full-stack development.",
      tools: ["Figma", "React", "TypeScript", "Node.js", "Express", "MongoDB Atlas", "JWT auth", "bcryptjs"],
      constraints: "Needed to feel private and safe by default, and to avoid the clinical tone of a typical mood-tracker.",
      outcome: "A complete, working full-stack personal project exploring emotional interface design.",
    },
    caseStudy: {
      messyProblem:
        "Most mood tracking is either a spreadsheet or a social media post — neither holds the actual texture of inner life. Most apps ask you to reduce a feeling to a single emoji or a number on a scale, which is fast to log but throws away almost everything that made the feeling worth writing down.",
      whyItMattered:
        "If the goal of journaling is genuine reflection, the format of the entry matters as much as the fact that you wrote one. A flattened mood log rarely gets reread with any feeling; a named space built from music, image, and words is something you might actually want to revisit.",
      northStar:
        "What does this look like if we refuse to reduce a feeling to a chartable value?",
      whoIDesignedFor:
        "People turning to journaling for creative self-expression and reflection, not clinical mood tracking — people who wanted the entry itself to feel like something, not just measure something, with room to eventually share it if they chose to.",
      constraints:
        "The product had to feel private and emotionally safe by default, avoid the sterile, clinical tone common to mood-tracking apps, and support genuinely multi-sensory entries — plus a community layer — without becoming overwhelming to create.",
      role:
        "I designed the product end to end in Figma and built the full stack solo — React and TypeScript frontend, Node/Express backend, MongoDB Atlas storage, Multer-based media uploads, and JWT/bcryptjs authentication to keep entries private to their author.",
      research:
        "I looked closely at why existing mood trackers felt disposable to use for more than a few days, and kept coming back to the same answer: a mood score has no texture, so there's nothing to feel nostalgic about when you look back at it.",
      productDecisionsIntro:
        "Reverie's decisions all follow from treating an emotional entry as something closer to a small creative artifact than a logged data point — even once a community layer entered the picture.",
      designExplorations:
        "I prototyped a version with a traditional mood-scale entry point alongside the richer multi-sensory version, and tested both against the same simple question: which one would I actually want to reread in three months? The scale version answered the tracking use case; the named-space version answered the reflection use case Reverie was actually built for.",
      systemOverview:
        "A React and TypeScript frontend supports composing named spaces from text, imagery, video (mp4/webm/mov), music references, and an AI prompt field for mood-board generation, with color and visual tone derived from entry content. A Node/Express and MongoDB Atlas backend stores entries with per-user isolation via JWT and bcryptjs, alongside a separate community discovery feed (likes, saves, comments on public spaces) and a personal timeline view with mood filtering. Media uploads run through Multer; an ambient music player persists across the app.",
      finalExperience:
        "Opening Reverie to write feels less like filling out a form and more like building a small room for a feeling — choosing a song, adding an image, writing a reflection — and the space that results looks and feels distinct from every other one, the way an actual memory would. From there, you can keep it private, revisit it on your timeline, or make it discoverable in the community feed.",
      whatShipped:
        "A full-stack journaling platform supporting named, multi-sensory emotional spaces with an AI mood-board prompt field, a community discovery feed, a timeline view, an ambient music player, and private, authenticated storage per user — built solo from Figma to MERN stack.",
      outcome:
        "A complete, working personal project that became a direct exploration of what emotional interface design looks like when data-entry conventions are deliberately set aside.",
      whatILearned:
        "Designing for emotion means resisting the instinct to make everything measurable. The features that made Reverie feel human were exactly the ones that refused to reduce a feeling to a chartable value.",
      whatIdImproveNext:
        "I'd design a gentler way to resurface old entries over time on the timeline — a resurfacing pattern, not a feed — so the atmosphere someone built around a past feeling could meet them again later, rather than the archive being something you only visit by scrolling back manually.",
    },
    stats: [
      { value: "5", label: "Content types per space — text, image, video, music, AI mood" },
      { value: "Solo", label: "Full-stack build, Dec 2025" },
    ],
  },
  {
    slug: "whisperwind-grove",
    title: "Whisperwind Grove",
    shortName: "Whisperwind Grove",
    oneLiner:
      "Four small worlds, one identity that follows you between all of them.",
    categories: ["creative-tools", "ai-trust"],
    primaryCategory: "creative-tools",
    description:
      "A full-stack capstone platform hosting four complete, distinct playable worlds — Spirit Drift, Delivery on the Wind, Spirit Sapling, and Rise of the Half Moon — each with its own mechanics and soundtrack, sharing one persistent player identity, achievements, and leaderboards.",
    users: "Casual players and interactive storytelling users.",
    role: "Game UX, product design, full-stack development, AI implementation.",
    keyDecision:
      "Connect four distinct game modes through one persistent identity and progression system instead of building four disconnected mini-games.",
    outcome: "CS Senior Capstone · Full marks across all evaluation categories",
    tools: [
      "TypeScript",
      "React 19",
      "Vite",
      "Node.js",
      "Express",
      "Phaser 3",
      "MongoDB",
      "Mongoose",
      "Gemini AI",
      "ElevenLabs",
      "JWT auth",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/aysesule2405/WW" },
      { label: "Live demo", href: "https://ww-seven-ruby.vercel.app/" },
      { label: "Figma", href: "https://fiesta-busy-93311900.figma.site" },
    ],
    glyph: "world-constellation",
    fieldNumber: "FS-06",
    date: "2026-04",
    dateLabel: "Spring 2026",
    images: [
      { src: `${GH_PAGES}/projects/Whisperwind%20Grove/whisperwind-grove.copy.jpg`, alt: "Whisperwind Grove key art" },
      { src: `${GH_PAGES}/projects/Whisperwind%20Grove/spirit-drift%20copy.png`, alt: "Spirit Drift wind arcade scene" },
      { src: `${GH_PAGES}/projects/Whisperwind%20Grove/rise-of-the-half-moon%20copy.png`, alt: "Rise of the Half Moon card game scene" },
      { src: `${GH_PAGES}/projects/Whisperwind%20Grove/delivery-on-the-wind%20copy.png`, alt: "Delivery on the Wind scene" },
      { src: `${GH_PAGES}/projects/Whisperwind%20Grove/spirit-sapling%20copy.png`, alt: "Spirit Sapling interaction scene" },
    ],
    decisionLog: [
      {
        decision: "Design one persistent player identity that carries across all four worlds before polishing any single one.",
        why: "Four separate games with four separate save files feel like four separate products — there's no reason for a player to feel invested across the whole platform rather than just their favorite mode. As a capstone with a hard deadline, it was tempting to make one world shine and leave the connective tissue for later — but the connective tissue was the actual thesis of the project.",
        tradeoff: "Every world had to be built against a common data model from day one, which constrained how independently each mode's mechanics could evolve, and meant less individual polish time per world.",
        result: "Achievements, progression, and profile customization in one world meaningfully carried weight in another — full marks across systems integration, AI implementation, and production-quality architecture.",
      },
      {
        decision: "Give Spirit Sapling's NPC Gemini-powered conversation that adjusts game mechanics based on emotional tone, instead of static dialogue trees.",
        why: "Static dialogue trees run out of things to say within a few interactions, which breaks immersion in a world meant to feel alive and worth returning to.",
        tradeoff: "AI-driven dialogue introduced unpredictability that had to be carefully scoped so responses stayed in-world and in-character rather than breaking tone.",
        result: "The sapling's emotional responses genuinely change how the game progresses — interactions stayed fresh across repeat visits in a way static dialogue couldn't sustain.",
      },
      {
        decision: "Give each guardian companion an ElevenLabs-generated voice rather than text-only dialogue.",
        why: "A world built around four distinct companions needed each one to feel like a separate character, not a reskinned template.",
        tradeoff: "Voice synthesis added integration and asset-management overhead across four separate personalities.",
        result: "Each guardian reads as a distinct character with its own voice and personality, reinforced by ElevenLabs-generated audio.",
      },
      {
        decision: "Build idempotent badge logic and real-time leaderboards as shared systems, not per-world features.",
        why: "Achievements only mean something if a player trusts they were earned correctly and update everywhere, instantly.",
        tradeoff: "Shared achievement/leaderboard infrastructure took longer to build than four independent scoring systems would have.",
        result: "Animated achievement unlocks and real-time leaderboard updates work consistently across all four worlds.",
      },
    ],
    evidenceRail: {
      users: "Casual players and users interested in interactive, AI-driven storytelling.",
      timeline: "Built Spring 2026 as a CS senior capstone at North American University.",
      role: "Game UX, product design, full-stack development, AI implementation.",
      tools: ["TypeScript", "React 19", "Vite", "Node.js", "Express", "Phaser 3", "MongoDB", "Mongoose", "Gemini AI", "ElevenLabs"],
      constraints: "Academic capstone deadline, needed one cohesive identity/achievement system across four distinct game modes.",
      outcome: "Full marks across all capstone evaluation categories: systems integration, AI implementation, production-quality architecture.",
    },
    caseStudy: {
      messyProblem:
        "It's easy to build one fun mini-game. It's much harder to make four different game modes — a wind arcade, a Kiki's Delivery Service–inspired delivery run, an AI-responsive sapling, and a strategy card game — feel like they belong to the same world, rather than four class projects bundled under a shared menu screen.",
      whyItMattered:
        "The capstone's real technical and design challenge wasn't any individual game mechanic — it was the shared architecture and identity system that made the whole platform feel like one coherent product instead of a portfolio of disconnected demos.",
      northStar:
        "Does your identity mean something no matter which of the four worlds you're standing in?",
      whoIDesignedFor:
        "Casual players looking for lightweight, varied gameplay, and anyone drawn to interactive storytelling shaped by AI-driven characters rather than fixed dialogue.",
      constraints:
        "A fixed academic capstone deadline and the structural challenge of designing four distinct game modes — Spirit Drift, Delivery on the Wind, Spirit Sapling, and Rise of the Half Moon — that still needed to share one data model for identity, achievements, and progression.",
      role:
        "I worked across game UX, product design, full-stack development, and the Gemini-based AI implementation for Spirit Sapling's NPC dialogue.",
      research:
        "I looked at why multi-game platforms often feel disjointed — usually because progression in one mode has zero bearing on any other — and used that as the design problem to solve first, before any individual game's mechanics.",
      productDecisionsIntro:
        "Every major decision on Whisperwind Grove was in service of one idea: your identity should mean something no matter which of the four worlds you're standing in.",
      designExplorations:
        "I prototyped the four modes first as fully independent systems, which was faster to build but immediately felt hollow — nothing you did in one world was legible in another. Retrofitting a shared identity and achievement layer afterward was more work than designing it in from the start would have been, which shaped the decision log above.",
      systemOverview:
        "A Node.js/Express and MongoDB/Mongoose backend maintains one player identity, profile, and achievement record shared across four Phaser 3–based game modes built in React 19, TypeScript, and Vite. Gemini AI powers Spirit Sapling's emotionally responsive dialogue and Rise of the Half Moon's optional AI move selection; ElevenLabs generates each guardian companion's voice. JWT authentication protects customizable profiles, avatars, and per-game audio/accessibility settings.",
      finalExperience:
        "A player creates one identity and can move between four distinct worlds, each with its own mechanics and soundtrack, but their achievements, profile customization, and sense of progress travel with them — and Spirit Sapling's guardian responds in real, generated conversation and voice rather than repeating fixed lines.",
      whatShipped:
        "A full-stack, four-world game platform — Spirit Drift, Delivery on the Wind, Spirit Sapling, Rise of the Half Moon — with shared player identity, idempotent achievement logic, real-time leaderboards, and Gemini/ElevenLabs-powered AI across all worlds, submitted and evaluated as a CS capstone project.",
      outcome:
        "The project received full marks across all capstone evaluation categories — systems integration, AI implementation, and production-quality architecture — with the shared-identity architecture specifically recognized as the project's central achievement.",
      whatILearned:
        "The feature that makes a multi-part product feel whole is rarely the flashiest individual piece — it's the connective system underneath that most players never consciously notice, but would immediately feel the absence of.",
      whatIdImproveNext:
        "I'd expand Spirit Sapling's memory model so it could reference a player's history across sessions and across worlds, rather than generating fresh, contextless dialogue each time — right now the AI conversation is dynamic, but it doesn't yet remember the player.",
    },
    stats: [
      { value: "4", label: "Playable game modes, one shared profile" },
      { value: "Full marks", label: "Every capstone evaluation category" },
    ],
  },
  {
    slug: "ghibli-guardians",
    title: "Ghibli Guardians — AI Safety Companion",
    shortName: "Ghibli Guardians",
    oneLiner:
      "A safety app that leads with warmth instead of an alarm, for the moment someone actually needs it.",
    categories: ["emotional-ux", "ai-trust"],
    primaryCategory: "emotional-ux",
    description:
      "A character-driven personal safety companion that assesses real risk, generates emergency messages with your location, and talks you through it — built to calm rather than escalate.",
    users: "Anyone who feels unsafe in the moment and needs both guidance and calm.",
    role: "Product design, full-stack development, emotional UX.",
    keyDecision:
      "Lead with a calming, character-driven interface instead of an alarm-style \"emergency button,\" and fall back to rule-based logic rather than block the feature when AI integrations failed.",
    tools: ["React", "Vite", "Node.js", "Express", "ElevenLabs", "Google Maps API"],
    links: [
      { label: "GitHub", href: "https://github.com/aysesule2405/G-Guardians" },
      { label: "Devpost", href: "https://devpost.com/software/ghibli-guardians" },
    ],
    glyph: "safety-signal",
    fieldNumber: "FS-07",
    date: "2026-02",
    dateLabel: "Feb 2026",
    images: [
      { src: `${GH_PAGES}/projects/Ghibli%20Guardians/dashboard.png`, alt: "Ghibli Guardians dashboard interface" },
      { src: `${GH_PAGES}/projects/Ghibli%20Guardians/mobile.png`, alt: "Ghibli Guardians mobile view" },
      { src: `${GH_PAGES}/projects/Ghibli%20Guardians/backend.png`, alt: "Ghibli Guardians backend architecture diagram" },
    ],
    decisionLog: [
      {
        decision: "Lead with a calming, character-driven interface instead of an alarm-style emergency button.",
        why: "Safety apps tend to feel like emergency buttons — cold and alarming, exactly the wrong tone for someone already scared.",
        tradeoff: "Warmth takes more design work than a red panic button: a character, a voice, a tone that had to be built and tested under a hackathon sprint.",
        result: "The interaction felt supportive rather than alarming, without losing any of the actual safety functionality underneath.",
      },
      {
        decision: "Build a risk-evaluation engine that reads time of day, lighting, environment type, and whether the user is alone.",
        why: "A single panic button doesn't help someone decide what's actually needed in their specific situation.",
        tradeoff: "More context-gathering logic to design and test within a single sprint, with real ambiguity in how to weigh each factor.",
        result: "Generated emergency messages reflected real context instead of a generic template.",
      },
      {
        decision: "Pivot to rule-based fallback logic when a primary AI integration failed mid-hackathon, instead of blocking the feature.",
        why: "Safety-critical features can't go down when a third-party API does — reliability had to outrank sophistication.",
        tradeoff: "Rule-based fallbacks are less flexible than the AI-driven version they replaced.",
        result: "The feature kept working through the entire judging period — reliability over complexity in a safety-critical context.",
      },
      {
        decision: "Use ElevenLabs voice playback for guardian guidance instead of text-only prompts.",
        why: "Text alone doesn't convey tone, and tone is most of what de-escalates fear in the moment.",
        tradeoff: "Voice integration added latency and complexity to an already tight build.",
        result: "The companion gained a felt personality that distinguished it from a generic safety checklist app.",
      },
    ],
    evidenceRail: {
      users: "Anyone who feels unsafe in the moment and needs both guidance and calm.",
      timeline: "Built in a single sprint at Rutgers University's HackHERS hackathon.",
      role: "Product design, full-stack development, emotional UX.",
      tools: ["React", "Vite", "Node.js", "Express", "ElevenLabs", "Google Maps API"],
      constraints: "Hackathon sprint timeline; needed a working fallback when third-party AI integrations failed mid-event.",
      outcome: "Built and demoed within a single HackHERS sprint at Rutgers University.",
    },
    caseStudy: {
      messyProblem:
        "Safety apps tend to feel like emergency buttons: cold, alarming, and built around the assumption that a crisis is already fully underway — exactly the wrong tone for someone who is scared but still trying to think clearly.",
      whyItMattered:
        "The tone of a safety tool changes whether someone actually opens and uses it in the moment they need it — a design choice with real stakes, not just an aesthetic preference.",
      northStar:
        "Does this feel supportive right now, or does it escalate the fear that's already there?",
      whoIDesignedFor:
        "Someone alone, in an environment that suddenly feels unsafe, who needs both practical guidance and to feel less afraid while getting it.",
      constraints:
        "A single HackHERS hackathon sprint, and a hard requirement that the safety-critical path keep working even if a third-party AI integration failed mid-event.",
      role:
        "I worked on product design, full-stack development, and the emotional UX of the companion character and interaction tone.",
      research:
        "The starting research was the emotional register of existing safety apps — most default to red alert colors and siren-style UI, which is the opposite of calming for someone already frightened.",
      productDecisionsIntro:
        "Every decision on Ghibli Guardians balanced two things at once: staying genuinely useful in a real emergency, and never tipping into a tone that escalates fear.",
      designExplorations:
        "The clearest exploration was forced, not chosen: when a primary AI integration broke mid-hackathon, the team had to decide in real time whether to cut the feature or rebuild its logic as deterministic rules. Rebuilding it as rules-based logic was the right call — it's the decision the case study leads with.",
      systemOverview:
        "A React and Vite frontend talks to a Node.js/Express backend. A risk-evaluation engine combines time of day, lighting, environment type, and alone-status to generate context-aware emergency messages with real-time Google Maps coordinates, shareable in one tap. ElevenLabs powers calm, character-driven voice guidance, with rule-based fallbacks in place wherever an AI integration might fail.",
      finalExperience:
        "Instead of a panic button, you get a character-driven companion: it asks a few quick contextual questions, assesses risk, and generates a shareable emergency message with your location — while a calm, voiced guardian talks you through what's happening, with chatbot-style guidance and copy/share actions throughout.",
      whatShipped:
        "A working safety companion with a context-aware risk engine, real-time Google Maps location sharing, ElevenLabs voice playback, trusted-contact management, and rule-based fallback logic for when AI integrations fail.",
      outcome:
        "Built and demoed within a single HackHERS sprint at Rutgers University.",
      whatILearned:
        "Reliability beats sophistication in safety-critical software. The moment the AI integration failed mid-hackathon was the most important design decision of the whole project, and it wasn't a design decision made in Figma — it was made under pressure, in code.",
      whatIdImproveNext:
        "I'd build an offline mode for the core risk-assessment and message-generation flow, since a safety app is least reliable exactly when connectivity is most likely to be poor.",
    },
    stats: [
      { value: "4", label: "Risk factors read in real time" },
      { value: "1 tap", label: "To generate & share an emergency message" },
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
