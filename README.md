# web-file-download

It uses an API server using node.js for /login and /download.html paths.

It uses simple HTML, CSS and JavaScript to take credentials and authenticate at the server before allowing downloading of the file.

The download.html is sent from the API server instead of keeping the file in the webroot as we are the using same location (download.html) for restricting the access.

The download.html uses a simple tric of CSS to show the progress bar and JavaScript to get the file in chunks and use the browser link to download the file.

All of this code was generated using ChatGPT 4.0 interactively through step by step.

The code was tested using AL2.

## Using nginx to route the traffic to the API server.

File: /etc/nginx/conf.d/web.conf

```
server
{
    root /node/web/dist;
    index index.html;

    server_name download.zinox.com;

    location /
    {
       try_files $uri $uri/ =404;
    }

    location /login {
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header Host $http_host;
       proxy_set_header X-NginX-Proxy true;
       proxy_pass http://localhost:3000/login;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_http_version 1.1;
       proxy_cache_bypass $http_upgrade;
       proxy_redirect off;
    }

    location /download.html {
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header Host $http_host;
       proxy_set_header X-NginX-Proxy true;
       proxy_pass http://localhost:3000/download.html;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_cache_bypass $http_upgrade;
       proxy_http_version 1.1;
       proxy_redirect off;
    }
}
```

## SSL for the domain

Installing pip3 on AL2

https://saturncloud.io/blog/how-to-install-pip3-on-amazon-linux-2/

Use LetsEncrypt to enable ssl for the domain 

https://certbot.eff.org/instructions?ws=nginx&os=pip

## API Server

Use node.js

## /Login path
```
app.post('/login',
    passport.authenticate('local', { failureRedirect: '/' }),
    function(req, res) {
	console.log("auth was successful");
        res.redirect('/download.html');  // Redirect to the download page if authentication succeeds
    }
);
```

The above path is called from index.html
```
        <form id="downloadForm" action="/login" method="POST">
            <input type="text" name="userID" id="userID" placeholder="User ID:" required>
            <input type="password" name="password" id="password" placeholder="Password:" required>
            <button type="submit">Proceed to Download</button>
        </form>
```

The /login path is rerouted from NGINX through its location to the localhost on port 3000 and to the /login path which is handled through node.js at the server. 
```
    location /login {
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header Host $http_host;
       proxy_set_header X-NginX-Proxy true;
       proxy_pass http://localhost:3000/login;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_http_version 1.1;
       proxy_cache_bypass $http_upgrade;
       proxy_redirect off;
    }
```

Upon successful auth, the redirect is made to the /download/html.

API Path
```
app.get('/download.html', function(req, res) {
    console.log("Get /download request");
    const filePath = path.join(__dirname, 'download.html');
    if (req.isAuthenticated()) {
	console.log("auth success");
	fs.readFile(filePath, 'utf8', (err, content) => {
          if (err) {
              res.status(500).send('Unable to read the file');
              return;
           }
           res.send(content);
        });
    } else {
	console.log("Not authenticated");
        res.redirect('/');  // If not authenticated, redirect to the main page
    }
});
```

The above will send download.html from the app directory on the server to the client.

NGINX reroutes the path /download.html to the API server through its web.conf file.
```
    location /download.html {
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header Host $http_host;
       proxy_set_header X-NginX-Proxy true;
       proxy_pass http://localhost:3000/download.html;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_cache_bypass $http_upgrade;
       proxy_http_version 1.1;
       proxy_redirect off;
    }
```

To serve the download.html content from your server.js (using Express) instead of Nginx serving it directly from the web root

NGINX sends download.html request to the API server at http://localhost:3000/download.html and the API server after validating the auth sends the download.html from the API dir to the client. The download.html uses downloadScript.js which is stored in the webroot and hence NGINX will send it to the client. 

We are not storing download.html in the webroot as we want that route to go to the API server.

## Passport authentication

We are using passport authentication through node.js.

In the server.js file, the POST call to /login is processed by Passport's middleware, and Passport extracts the username and password fields from the incoming POST request for us.

Here's how it works:

When you make a POST request from the index.html form to /login, the form data (i.e., username and password fields) is sent in the HTTP request body.

The bodyParser.urlencoded({ extended: false }) middleware parses this incoming form data and populates req.body with the parsed data. So, req.body will look something like:

```
    {
       usernameField: 'userID',
       passwordField: 'password'
    }
```

The userID and password are the input fields in index.html so we have to tell passport to use those names instead of using default names (username, password)

When you call passport.authenticate('local', ...) for the /login route, Passport uses the LocalStrategy you've defined to authenticate the user.

Inside the LocalStrategy, Passport automatically looks for username and password fields in req.body. These field names are default, and Passport will use them out-of-the-box. If you had different field names, you would have to specify them when setting up the LocalStrategy.

```
passport.use(new LocalStrategy(
    {
       usernameField: 'userID',
       passwordField: 'password'
    },
    function(username, password, done) {
	console.log("Server userID: ", username, " password: ", password);
        if (username === "admin" && password === "SecretPassw0rd") {
            return done(null, { id: 1, username: "admin" });
        } else {
            return done(null, false, { message: 'Incorrect credentials.' });
        }
    }
));
```
In the LocalStrategy function, the username and password parameters are automatically populated by Passport from the parsed req.body data. So you don't have to manually extract them; Passport handles that for you.

We are using just a local auth, passport can be used with sqlite3 and other databases as well.

# Download file

downloadScript.js does the client work of downloading the file in chunks so that we can show the progress through HTML/CSS.

```
document.addEventListener("DOMContentLoaded", function() {
    const progressBar = document.getElementById("progressBar");

    // Assuming the file URL is /file-to-download (change to your actual file URL)
    const fileURL = "/my-download-file.pdf";
    const chunks = [];
    
    fetch(fileURL).then(response => {
        const reader = response.body.getReader();
        const contentLength = +response.headers.get("Content-Length");
        let receivedLength = 0;

        function processChunk({ done, value }) {
            if (done) {
                // All chunks received, create a Blob and save it
                const blob = new Blob(chunks);
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(blob);

                // Set a filename for the download
                downloadLink.download = 'download.pdf'; // Replace 'filename.ext' with the desired filename and extension

                // Trigger the download by simulating a click on the link
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
		document.getElementById("downloadStatus").textContent = "Download complete";
                console.log("Download finished!");
                return;
            }

            chunks.push(value);
            receivedLength += value.length;
            const percentComplete = (receivedLength / contentLength) * 100;
            progressBar.value = percentComplete;
	    document.getElementById("progressText").textContent = `${Math.round(percentComplete)}%`;	

            console.log(`Received ${receivedLength} of ${contentLength}`);

            // Read the next chunk
            return reader.read().then(processChunk);
        }

        return reader.read().then(processChunk);

    }).catch(error => {
        console.error("Error downloading the file:", error);
    });
});
```

Here's a brief explanation of the script:

- The script waits for the document to be fully loaded using the DOMContentLoaded event.
- It then gets the download button and progress bar elements.
- Upon clicking the download button, it initiates a fetch to the given file URL.
- To trigger the browser's file download dialog to save the downloaded content locally, create a blob from the response data and use the URL.createObjectURL method to convert it to a downloadable link.

As the file is downloaded in chunks, it updates the progress bar.

The appropriate HTML elements in download.html for the script to work:

```
<body>
    <div class="container">
        <h2 id="downloadStatus">Downloading File...</h2>
        <div class="progress-container">
	  <progress id="progressBar" value="0" max="100"></progress>
          <span id="progressText">0%</span>
	</div>
    </div>
    <script src="downloadScript.js"></script>
</body>
```

* We keep the chunked downloading logic as it was earlier.
* We store each chunk of data in an array called chunks.
* Once all chunks are received (i.e., the done variable is true), we combine all chunks into a single Blob.
* We then create a download link and simulate a click on it to save the combined blob as a file locally.
* This approach uses the chunked downloading to update the progress bar, and at the end of the download, the content is saved to the local system.

The /my-download-file.pdf file on the server gets downloaded as download.pdf. 

The caveat here is that if people know the name of the file on the webroot, then they can download it bypassing the auth. There could be other method, where we could send the PDF through the API server so that there is no way to hack it.

I am sure that there are better methods to protect the downloaded file properly through the auth.

If people go to the /download.html directly, it will be caught by the API server and then it will send the /download.html after proper auth otherwise redirect to the login page (index.html).

## Progress Bar

The progress bar shows the progress based upon data fetched through downloadScript.js file.

The progress bar is through CSS.

Add styles for the progress bar and the percentage text. The following is a simple example.

```
.progress-container {
    width: 100%;
    max-width: 400px; /* adjust as needed */
    position: relative;
}

progress {
    width: 100%;
    height: 20px; /* adjust as needed */
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    overflow: hidden;
}

progress[value]::-webkit-progress-bar {
    background-color: #eee;
}

progress[value]::-webkit-progress-value {
    background-color: #3498db; /* blue color; adjust as desired */
    transition: width 0.2s;
}

progress[value]::-moz-progress-bar {
    background-color: #3498db; /* blue color; adjust as desired */
}

#progressText {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
}
```



