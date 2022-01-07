var Upload = function (file) {
    this.file = file;
};

Upload.prototype.getType = function () {
    return this.file.type;
};

Upload.prototype.getSize = function () {
    return this.file.size;
};

Upload.prototype.getName = function () {
    return this.file.name;
};

Upload.prototype.doUpload = function () {
    var that = this;
    var formData = new FormData();

    // add assoc key values, this will be posts values
    formData.append("file", that.file, that.getName());
    formData.append("upload_file", true);

    if (this.options)
        for (var i in this.options)
            formData.append(i, this.options[i]);

    $.ajax({
        type: "POST",
        url: that.url,
        xhr: function () {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                myXhr.upload.addEventListener('progress', that.progressHandling, false);
            }
            return myXhr;
        },
        success: function (data) {
            // your callback here
        },
        error: function (error) {
            // handle error
        },
        async: true,
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        timeout: 60000
    });
};

Upload.prototype.progressHandling = function (event) {
    var percent = 0;
    var position = event.loaded || event.position;
    var total = event.total;
    var progress_bar_id = "#progress-wrp";
    if (event.lengthComputable) {
        percent = Math.ceil(position / total * 100);
    }
    // update progressbars classes so it fits your code
    $(progress_bar_id + " .progress-bar").css("width", +percent + "%");
    $(progress_bar_id + " .status").text(percent + "%");
};

Upload.browseFile = Upload.prototype.browseFile = function (options) {
    var self = this;
    var fileInput = $("#fileInput");

    if (!fileInput.length) {
        fileInput = $("<input type='file' id='fileInput' name='file' style='display: none'>");
        $(document.body).append(fileInput);

        for (var i in options)
            if (i != "url")
                fileInput.attr(i, options[i]);

        //Change id to your id
        $(fileInput).on("change", function (e) {
            var file = $(fileInput)[0].files[0];
            if (file) {
                var upload = new Upload(file);
                upload.url = options.url || "upload";
                upload.options = options;

                // maybe check size or type here with upload.getSize() and upload.getType()

                // execute upload
                upload.doUpload();
            } else {
                alert("Unexpected Error!!!");
            }
        });
    }

    fileInput.click();

};