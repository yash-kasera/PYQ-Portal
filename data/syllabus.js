// Syllabus structure — B.Tech III Semester (AI & DS), Jabalpur Engineering College
// Extracted from the AICTE Model Curriculum scheme document (w.e.f. July 2023).
window.SYLLABUS = {
  math: {
    name: "Mathematics-III",
    short: "Maths-III",
    code: "MA33 / MA331",
    accent: "indigo",
    modules: [
      { n: 1, name: "Numerical Methods-I", hours: 8, topics: [
        { id: "bisection", name: "Bisection method" },
        { id: "newton-raphson", name: "Newton–Raphson method" },
        { id: "regula-falsi", name: "Regula–Falsi method" },
        { id: "finite-differences", name: "Finite differences & relation between operators" },
        { id: "interpolation-equal", name: "Newton's forward & backward interpolation" },
        { id: "interpolation-unequal", name: "Divided differences & Lagrange's formula" }
      ]},
      { n: 2, name: "Numerical Methods-II", hours: 10, topics: [
        { id: "numerical-differentiation", name: "Numerical differentiation" },
        { id: "numerical-integration", name: "Trapezoidal, Simpson's 1/3 & 3/8 rules" },
        { id: "linear-systems", name: "Gauss Elimination, Jordan, Crout, Jacobi, Gauss-Seidel, Relaxation" },
        { id: "taylor-euler", name: "Taylor's series, Euler & modified Euler methods" },
        { id: "runge-kutta", name: "Runge–Kutta 4th order, Milne's & Adam's methods" }
      ]},
      { n: 3, name: "Basic Probability", hours: 8, topics: [
        { id: "probability-spaces", name: "Probability spaces & probability measure" },
        { id: "counting-probability", name: "Counting techniques" },
        { id: "conditional-probability", name: "Conditional probability" },
        { id: "bayes-theorem", name: "Baye's theorem" },
        { id: "random-variables", name: "Random variable & distribution function" },
        { id: "moments", name: "Moments, expectation, variance, Chebyshev inequality" },
        { id: "mgf", name: "Moment generating function" },
        { id: "bivariate-rv", name: "Bivariate discrete & continuous random variables" }
      ]},
      { n: 4, name: "Probability Distribution", hours: 8, topics: [
        { id: "skewness-kurtosis", name: "Measures of central tendency, moments, skewness & kurtosis" },
        { id: "binomial-distribution", name: "Binomial distribution" },
        { id: "poisson-distribution", name: "Poisson's distribution" },
        { id: "normal-distribution", name: "Normal distribution" },
        { id: "exponential-distribution", name: "Exponential distribution" }
      ]},
      { n: 5, name: "Applied Statistics", hours: 6, topics: [
        { id: "curve-fitting", name: "Curve fitting by least squares (lines, parabolas, general curves)" },
        { id: "significance-tests", name: "Test of significance: large samples, proportions, means" }
      ]}
    ]
  },

  dsa: {
    name: "Data Structures and Algorithms",
    short: "DSA",
    code: "AI33 / AI303",
    accent: "teal",
    modules: [
      { n: 1, name: "Introduction", topics: [
        { id: "basic-terminology", name: "Elementary data organization & data structure operations" },
        { id: "arrays", name: "Arrays, sparse matrices & memory representation" },
        { id: "memory-allocation", name: "Static & dynamic memory allocation" },
        { id: "asymptotic-notations", name: "Analysis of algorithms, asymptotic notations, time-space tradeoff" },
        { id: "searching", name: "Linear search & binary search with complexity analysis" }
      ]},
      { n: 2, name: "Stacks and Queues", topics: [
        { id: "stack", name: "ADT Stack: operations, algorithms & complexity" },
        { id: "expression-conversion", name: "Expression conversion & evaluation (infix/postfix/prefix)" },
        { id: "queue", name: "ADT Queue: simple, circular & priority queue" }
      ]},
      { n: 3, name: "Linked Lists", topics: [
        { id: "singly-linked-list", name: "Singly linked lists: representation, traversal, search, insert, delete" },
        { id: "doubly-linked-list", name: "Doubly linked list & its operations" },
        { id: "circular-linked-list", name: "Circular linked list & its operations" }
      ]},
      { n: 4, name: "Trees", topics: [
        { id: "binary-tree", name: "Tree terminology, binary tree & representations" },
        { id: "tree-traversal", name: "Tree traversals: pre-order, in-order, post-order" },
        { id: "threaded-binary-tree", name: "Threaded binary tree" },
        { id: "bst", name: "Binary search tree operations" },
        { id: "avl-tree", name: "AVL tree & rotations" },
        { id: "b-tree", name: "B tree: definition & operations" },
        { id: "b-plus-tree", name: "B+ tree: definition & operations" }
      ]},
      { n: 5, name: "Sorting and Hashing", topics: [
        { id: "selection-sort", name: "Selection sort" },
        { id: "bubble-sort", name: "Bubble sort" },
        { id: "insertion-sort", name: "Insertion sort" },
        { id: "quick-sort", name: "Quick sort" },
        { id: "merge-sort", name: "Merge sort" },
        { id: "heap-sort", name: "Heap sort" },
        { id: "hashing", name: "Hashing & collision handling techniques" },
        { id: "graphs", name: "Graphs: terminology, representations, BFS & DFS" }
      ]}
    ]
  },

  oop: {
    name: "Object Oriented Programming Using Java",
    short: "OOP (Java)",
    code: "AI34 / AI304",
    accent: "amber",
    modules: [
      { n: 1, name: "Introduction", topics: [
        { id: "oop-vs-pop", name: "OOP vs procedural programming; merits & demerits" },
        { id: "oop-concepts", name: "Features of the object oriented paradigm" },
        { id: "object-model", name: "Object model: elements of OOPS, object/dynamic/functional models" },
        { id: "java-basics", name: "JVM, JRE, JDK, platform independence & data types" }
      ]},
      { n: 2, name: "Encapsulation and Data Abstraction", topics: [
        { id: "classes-objects", name: "Concept of objects: state, behavior, identity; classes & instances" },
        { id: "encapsulation-abstraction", name: "Encapsulation & data abstraction" },
        { id: "access-modifiers", name: "Access modifiers / access specifiers" },
        { id: "static-members", name: "Static members of a class" },
        { id: "message-passing", name: "Message passing & argument passing" },
        { id: "constructors", name: "Construction and destruction of objects" }
      ]},
      { n: 3, name: "Relationships", topics: [
        { id: "inheritance", name: "Inheritance: purpose and its types, 'is a' relationship" },
        { id: "association-aggregation", name: "Association & aggregation" },
        { id: "abstract-classes-interfaces", name: "Abstract classes & interfaces" }
      ]},
      { n: 4, name: "Polymorphism", topics: [
        { id: "polymorphism", name: "Introduction to polymorphism; static & run-time polymorphism" },
        { id: "overloading-overriding", name: "Method overriding & overloading" },
        { id: "binding", name: "Early binding & late binding" }
      ]},
      { n: 5, name: "Multithreading & Exception Handling", topics: [
        { id: "multithreading", name: "Processes vs threads, thread states, creation, priorities, synchronization, inter-thread communication" },
        { id: "exception-handling", name: "try, catch, throw, throws, finally; user-defined & built-in exceptions" }
      ]}
    ]
  },

  dld: {
    name: "Digital Logic Design & Computer Organization",
    short: "DLD & CO",
    code: "AI35 / AI305",
    accent: "rose",
    modules: [
      { n: 1, name: "Basic Structure of Computers", topics: [
        { id: "functional-units", name: "Computer types, functional units & basic operational concepts" },
        { id: "bus-structures", name: "Bus structures, software performance, multiprocessors, generations" },
        { id: "number-conversion", name: "Number base conversions: binary, octal, hexadecimal; fixed & floating point" },
        { id: "complements", name: "Complements & signed binary numbers" },
        { id: "binary-codes", name: "Binary codes: BCD, Excess-3, Gray, ASCII" }
      ]},
      { n: 2, name: "Digital Logic Circuits", topics: [
        { id: "logic-gates", name: "Basic logic functions, logic gates & universal gates" },
        { id: "boolean-algebra", name: "Minimization of logic expressions" },
        { id: "k-map", name: "K-map method" },
        { id: "flip-flops", name: "Flip-flops" },
        { id: "combinational-circuits", name: "Combinational circuits: adders, subtractors" },
        { id: "registers-counters", name: "Registers, shift registers & binary counters" },
        { id: "multiplexers", name: "Decoders, multiplexers & programmable logic devices" }
      ]},
      { n: 3, name: "Computer Arithmetic & Instruction Set", topics: [
        { id: "computer-arithmetic", name: "Fixed & floating point add, subtract, multiply, divide algorithms" },
        { id: "instruction-formats", name: "Memory locations & addresses, instruction formats, address sequencing" },
        { id: "addressing-modes", name: "Various addressing modes" }
      ]},
      { n: 4, name: "Processor Organization & Memory", topics: [
        { id: "instruction-cycle", name: "Introduction to CPU, register transfers, execution of instructions" },
        { id: "microprogrammed-control", name: "Hardwired control & microprogrammed control" },
        { id: "memory-organization", name: "RAM, ROM, memory hierarchy, virtual memory & secondary storage" },
        { id: "cache-memory", name: "Cache memories" },
        { id: "io-organization", name: "I/O organization, interrupts & polling" },
        { id: "dma", name: "Direct memory access" },
        { id: "io-interfaces", name: "Buses, interface circuits & standard I/O interfaces" }
      ]},
      { n: 5, name: "Computer Network", topics: [
        { id: "computer-networks", name: "Basic terminologies: LAN, WAN, MAN, PAN" },
        { id: "network-devices", name: "Network devices: routers, hubs, switches, bridges, Ethernet" },
        { id: "osi-model", name: "Network topology & basic OSI model" }
      ]}
    ]
  },

  eee: {
    name: "Energy & Environmental Engineering",
    short: "EEE",
    code: "CH32 / CH302",
    accent: "green",
    modules: [
      { n: 1, name: "Introduction to Energy Science", topics: [
        { id: "energy-sources", name: "World & Indian energy scenario, fossil fuels, energy systems" },
        { id: "energy-sustainability", name: "Energy sustainability & environment" },
        { id: "solar-energy", name: "Solar energy" },
        { id: "alternative-energy", name: "Biomass, wind, nuclear, wave, tidal, hydrogen & geothermal energy" },
        { id: "batteries", name: "Batteries: lead-acid, Ni-Cd & lithium" },
        { id: "fuel-cells", name: "Fuel cell: hydrogen-oxygen fuel cell" }
      ]},
      { n: 2, name: "Environmental Pollution A", topics: [
        { id: "air-pollution", name: "Air pollution: primary & secondary pollutants, photochemical smog" },
        { id: "global-warming", name: "Climate change & global warming" },
        { id: "ozone-depletion", name: "Ozone layer depletion" },
        { id: "pollution-case-studies", name: "Case studies: Bhopal gas, London smog, Minamata, oil spills" },
        { id: "water-pollution", name: "Water pollution, waste water treatment, acid rain, water conservation" },
        { id: "noise-pollution", name: "Noise pollution: causes, effects & control" }
      ]},
      { n: 3, name: "Environmental Pollution B", topics: [
        { id: "soil-pollution", name: "Soil pollution & soil erosion" },
        { id: "thermal-pollution", name: "Thermal pollution" },
        { id: "nuclear-pollution", name: "Nuclear pollution & nuclear hazards" },
        { id: "solid-waste", name: "Solid waste management: MSW collection & disposal" },
        { id: "disaster-management", name: "Disaster management: earthquakes, floods, landslides, tsunami" },
        { id: "carbon-footprint", name: "Carbon footprint & carbon trading" }
      ]},
      { n: 4, name: "Ecosystem & Biodiversity", topics: [
        { id: "ecosystem", name: "Structure & function of ecosystems, food chains, webs, pyramids" },
        { id: "biodiversity", name: "Biodiversity: genetic, species & ecosystem diversity; hotspots" },
        { id: "biodiversity-conservation", name: "Threats to biodiversity; in-situ & ex-situ conservation" },
        { id: "environmental-acts", name: "Environment Protection Act & related legislation" }
      ]},
      { n: 5, name: "Corrosion & its Prevention", topics: [
        { id: "corrosion-mechanism", name: "Theories & mechanism: dry and wet (electrochemical) corrosion" },
        { id: "corrosion-types", name: "Galvanic, concentration cell, pitting, waterline & differential aeration corrosion" },
        { id: "corrosion-control", name: "Control: design, alloys, passivity, cathodic protection, inhibitors" },
        { id: "protective-coatings", name: "Protective coatings: hot dipping, electroplating, metal spraying, cladding" }
      ]}
    ]
  }
};

window.SUBJECT_ORDER = ["math", "dsa", "oop", "dld", "eee"];
