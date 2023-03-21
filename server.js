const express = require('express');
const mysql = require('mysql2');
const inquirer = require('inquirer');
const cTable = require('console.table');
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const app = express();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '!P@ssword',
    database: 'company_db'
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Main menu prompts
const questionMain = [
    {
        type: 'list',
        message: 'What would you like to do?',
        name: 'menu',
        choices: [
            'View All Employees',
            'Add Employee',
            'Update Employee Role',
            'View All Roles',
            'Add Role',
            'View All Departments',
            'Add Department',
            'View Utilized Budget',
            'Quit'
        ]
    }
]

//Get all employee information (First name, last name, title, department, salary, and manager)
function viewAllEmp() {
    connection.query(
        `SELECT A.id, A.first_name, A.last_name, role.title, department.name AS department, role.salary, CONCAT(B.first_name, ' ', B.last_name) AS manager
        FROM (employee A LEFT JOIN employee B ON B.id = A.manager_id)
        JOIN role ON role.id = A.role_id
        JOIN department ON department.id = role.department_id`,
        function (err, results) {
            if (err) throw err;
            console.log();
            console.table(results);
            promptUser();
        });
}

//Add employee using their first name, last name, role, and manager
function addEmp() {
    //Perform queries before asking for input to get dynamic choices in list prompts
    Promise.all([
        //Get list of employee names
        connection.promise().query('SELECT CONCAT(first_name, " ", last_name) AS name FROM employee'),
        //Get list of roles
        connection.promise().query('SELECT title FROM role')
    ])
    .then(([empResults, roleResults]) => {
        var empList = empResults[0].map(emp => emp.name); //Map employee list to an array to use in prompt list
        empList.push("None"); //Add 'None' as a possible choice for manager
        var roleList = roleResults[0].map(role => role.title); //Map role list to an array to use in prompt list
        inquirer
            .prompt([
                {
                    type: 'input',
                    message: "What is the employee's first name?",
                    name: 'fName'
                },
                {
                    type: 'input',
                    message: "What is the employee's last name?",
                    name: 'lName'
                },
                {
                    type: 'list',
                    message: "What is the employee's role?",
                    name: 'role',
                    choices: roleList
                },
                {
                    type: 'list',
                    message: "Who is the employee's manager?",
                    name: 'manager',
                    choices: empList
                }
            ])
            .then((results) => {
                //If no manager is selected, manager_id is set to NULL when inserting values
                if (results.manager === "None"){
                    //Get ID of role based on it's title
                    connection.promise().query(`SELECT id FROM ROLE WHERE title = '${results.role}'`)
                    .then((result) => {
                        var role = result[0][0].id;
                        connection.query(
                            `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ('${results.fName}', '${results.lName}', ${role}, NULL)`,
                            function (err) {
                                if (err) throw err;
                                console.log(`${results.fName} ${results.lName} has been added`);
                                promptUser();
                            }
                        )
                    })                    
                }                
                else {
                    Promise.all([
                    //Get ID of the selected role title
                    connection.promise().query(`SELECT id FROM ROLE WHERE title = '${results.role}'`),
                    //Get ID of the selected manager
                    connection.promise().query(`SELECT id FROM employee WHERE CONCAT(first_name, " ", last_name) = '${results.manager}'`)
                    ])
                    .then(([roleResults, managerResults]) => {
                        var role = roleResults[0][0].id;
                        var manager_id = managerResults[0][0].id;
                        connection.query(
                            `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ('${results.fName}', '${results.lName}', ${role}, ${manager_id})`,
                            function (err) {
                                if (err) throw err;
                                console.log(`${results.fName} ${results.lName} has been added`);
                                promptUser();
                            }
                        )
                    })
                }
            })
    })
}

//Update employee's role
function updateEmp() {
    Promise.all([
        //Get list of employee names
        connection.promise().query('SELECT CONCAT(first_name, " ", last_name) AS name FROM employee'),
        //Get list of role titles
        connection.promise().query('SELECT title FROM role')
    ])
        .then(([empResults, roleResults]) => {
            var empList = empResults[0].map(emp => emp.name); //Map employee list to an array to use in prompt list
            var roleList = roleResults[0].map(role => role.title); //Map role list to an array to use in prompt list
            inquirer
                .prompt([
                    {
                        type: 'list',
                        message: "Which employee's role do you want to update?",
                        name: 'name',
                        choices: empList
                    },
                    {
                        type: 'list',
                        message: 'Which role do you want to assign the selected employee?',
                        name: 'role',
                        choices: roleList
                    }
                ])
                .then((results) => {
                    //Get ID of the selected role
                    connection.promise().query(`SELECT id FROM role WHERE title = '${results.role}'`)
                        .then((result) => {
                            var role_id = result[0][0].id;
                            //Update the employee's role
                            connection.query(`UPDATE employee SET role_id = ${role_id} WHERE CONCAT(first_name, " ", last_name) = '${results.name}'`,
                                function (err) {
                                    if (err) throw err;
                                    console.log(`${results.name} has been updated to ${results.role}`)
                                    promptUser();
                                })
                        })
                })
        })
}

//Get a list of all roles
function viewAllRoles() {
    connection.query(
        `SELECT role.id, role.title, department.name AS department, role.salary
        FROM role
        JOIN department ON department.id = role.department_id`,
        function (err, results) {
            if (err) throw err;
            console.log();
            console.table(results);
            promptUser();
        });
}

//Add a new role using it's title, salary, and which department it belongs to
function addRole() {
    //Get a list of all departments to populate the list prompt
    connection.promise().query(`SELECT * FROM department`)
        .then((result) => {
            var departments = result[0];
            inquirer
                .prompt([
                    {
                        type: 'input',
                        message: 'What is the name of the role?',
                        name: 'title'
                    },
                    {
                        type: 'input',
                        message: 'What is the salary of the role?',
                        name: 'salary'
                    },
                    {
                        type: 'list',
                        message: 'What department does the role belong to?',
                        name: 'department',
                        choices: departments
                    }
                ])
                .then((response) => {
                    //Get id for the selected department
                    connection.promise().query(`SELECT id FROM department WHERE name = "${response.department}"`)
                        .then((result) => {
                            var department_id = result[0][0].id;
                            connection.query(
                                `INSERT INTO role (title, salary, department_id) VALUES ("${response.title}", ${response.salary}, ${department_id})`,
                                function (err, results) {
                                    if (err) throw err;
                                    console.log(`${response.title} has been added`);
                                    promptUser();
                                })
                        })
                        .catch((err) => {
                            throw err;
                        })
                })
        })
        .catch((err) => {
            throw err;
        })
}

//Get a list of all departments
function viewAllDepartments() {
    connection.query(
        'SELECT * FROM department',
        function (err, results) {
            console.log();
            console.table(results);
            promptUser();
        });
}

//Add a new department using it's name
function addDepartments() {
    inquirer
        .prompt({
            type: 'input',
            message: 'What is the name of the department?',
            name: 'department'
        })
        .then((response) => {
            connection.query(
                `INSERT INTO department (name) VALUES ("${response.department}")`,
                function (err) {
                    if (err) throw err;
                    console.log(`${response.department} has been added`);
                    promptUser();
                })
        })
}

//Get a total utilized budget of a department
function viewUsedBudget() {
    //Get a list of departments
    connection.promise().query(`SELECT * FROM department`)
        .then((result) => {
            var departments = result[0];
            inquirer
                .prompt(
                    {
                        type: 'list',
                        message: 'What department do you want to view the used budget for?',
                        name: 'department',
                        choices: departments
                    })
                .then((response) => {
                    //Get id for the selected department
                    connection.promise().query(`SELECT id FROM department WHERE name = "${response.department}"`)
                        .then((result) => {
                            var department_id = result[0][0].id;
                            //Select the SUM of all employee salaries where the employee role_id is part of the selected department
                            connection.query(
                                `SELECT SUM(r.salary) AS budget FROM employee AS e JOIN role AS r ON r.id = e.role_id LEFT JOIN department AS d ON d.id = r.id WHERE r.department_id = ${department_id}`,
                                function (err, results) {
                                    if (err) throw err;
                                    console.log();
                                    console.table([{Department: response.department, Budget: results[0].budget}]);
                                    promptUser();
                                })
                        })
                        .catch((err) => {
                            throw err;
                        })
                })
        })
        .catch((err) => {
            throw err;
        })
}

//Application main menu. User gets this prompt after each action until they select 'Quit'
function promptUser() {
    inquirer
        .prompt(questionMain)
        .then((response) => {
            console.log(response.menu);
            switch (response.menu) {
                case 'View All Employees':
                    viewAllEmp();
                    break;
                case 'Add Employee':
                    addEmp();
                    break;
                case 'Update Employee Role':
                    updateEmp();
                    break;
                case 'View All Roles':
                    viewAllRoles();
                    break;
                case 'Add Role':
                    addRole();
                    break;
                case 'View All Departments':
                    viewAllDepartments();
                    break;
                case 'Add Department':
                    addDepartments();
                    break;
                case 'View Utilized Budget':
                    viewUsedBudget();
                    break;
                case 'Quit':
                    console.log("Goodbye!");
                    connection.end();
                    process.exit();
            }
        })
}

//End program
app.use((req, res) => {
    res.status(404).end();
});

app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT} 🚀`);
    promptUser();
});
