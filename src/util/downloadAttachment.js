const dialog = require("electron").remote.dialog;
const fs = require("fs");
const https = require("https");

export function downloadAttachment(attachment) {
    dialog.showSaveDialog({ defaultPath: attachment.filename }).then(response => {
        if (!response.canceled) {
            var filewrite = fs.createWriteStream(response.filePath);

            const request = https.get(attachment.file_url, function(response) {
                response.pipe(filewrite);

                filewrite.on("finish", function() {
                    filewrite.close();
                });
            });
            
            request.on("error", function(err) {
                alert("There was an error downloading attachment " + attachment.filename + ".\n\nMessage: ", err.message);

                fs.unlinkSync(response.filePath); 
            });
        }
    });
}