
const projects = [
  {
    id: 1,
    name: "EduCart",
    description: "An e-commerce platform for online courses.",
    status: "In Progress",
    progress: 65,
    dueDate: "2026-11-15",
    teamMembers: ["Wubadel", "Abel"],
    tasks:[
      {
        id:101,
        title:"building product listing",
        status:"Completed",
        priority:"High",
      },
     {
        id:102,
        title:"Implementing shoping cart",
        status:"In Progress",
        priority:"High",
      },
      {
        id:103,
        title:"Add user authentication",
        status:"Todo",
        priority:"Medium"
      }
    ]
  },
  {
    id: 2,
    name: "University Management System",
    description: "Manage student records and university activities.",
    status: "In Progress",
    progress: 40,
    dueDate: "2026-11-25",
    teamMembers: ["Wubadel", "Mekdes"],
    tasks:[

    ]
  },
  {
    id: 3,
    name: "AI Study Assistant",
    description: "Help students organize learning and study plans.",
    status: "Planning",
    progress: 15,
    dueDate: "2026-12-10",
    teamMembers: ["Wubadel"],
    tasks:[
      
    ]
  },
  {
    id: 4,
    name: "Developer Portfolio",
    description: "Showcase projects, skills, and experience.",
    status: "Completed",
    progress: 100,
    dueDate: "2026-10-01",
    teamMembers: ["Wubadel"],
    tasks:[
      
    ]
  },
  {
    id: 5,
    name: "Restaurant Menu App",
    description: "Let restaurant customers browse menus using QR codes.",
    status: "In Progress",
    progress: 75,
    dueDate: "2026-11-05",
    teamMembers: ["Wubadel", "Abel"],
    tasks:[
      
    ]
  },
];

export default projects;
