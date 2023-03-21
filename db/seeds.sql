INSERT INTO department (id, name)
VALUES (1, 'Sales'),
       (2, 'Engineering'),
       (3, 'Accounting');

INSERT INTO role (id, title, salary, department_id)
VALUES (1, 'Sales Lead', 95000, 1),
       (2, 'Salesperson', 80000, 1),
       (3, 'Lead Engineer', 145000, 2),
       (4, 'Junior Developer', 90000, 2),
       (5, 'Account Manager', 105000, 3),
       (6, 'Accounting Staff', 120000, 3);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ('James', 'Bond', 1, null),
       ('Tom', 'Cruise', 2, 1),
       ('Jason', 'Bourne', 3, null),
       ('Megan', 'Fox', 4, 3),
       ('Vin', 'Diesel', 5, null),
       ('Morgan', 'Freeman', 6, 5);