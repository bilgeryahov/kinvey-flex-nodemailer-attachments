"use-strict"

// External packages.
const kinveyFlexSDK = require("kinvey-flex-sdk");
const nodemailer = require("nodemailer");
const ical = require('ical-generator');

// Internal mailing service configuration.
const mailingServiceConfig = require("./mailingServiceConfig.json");

/**
 * Creates the Gmail Calendar Event.
 * 
 * @param {Object} options
 * 
 * @returns {Object} Oject which contains data for the e-mail
 * message to be sent. 
 */
const createGmailCalenderEvent = function (options) {
    let cal = ical();
    cal.createEvent({
        start: new Date(options.start),
        end: new Date(options.end),
        summary: options.subject,
        description: options.description || "",
        location: options.location
    });
    return {
        replyTo: options.replyTo,
        from: options.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        alternatives: [{
            contentType: "text/calendar",
            content: new Buffer(cal.toString())
        }]
    };
};

// Initialize the Kinvey Flex Service.
kinveyFlexSDK.service((error, flex) => {
    if (error) {
        // Who logs you, mate?
       console.log("Error while initializing Flex!");
       return; 
    }
    // Register the Kinvey Flex Function.
    flex.functions.register("sendMessage", (context, complete, modules) => {
        // Create the Nodemailer message transporter.
        let transporter = nodemailer.createTransport({
            service: mailingServiceConfig.name,
            auth:{
                user: mailingServiceConfig.username,
                pass: mailingServiceConfig.password
            }
        });
        // Attempt to send the e-mail message.
        transporter.sendMail(createGmailCalenderEvent(context.body), (error, data) => {
            // Not good.
            if(error){
                flex.logger.error(error);
                return complete().setBody({ 
                    success: false, 
                    message: "Sending message failed.",
                    additional: "Please see Kinvey Flex logs"
                }).runtimeError().done();
            }
            // All fine.
            flex.logger.info(data);
            return complete().setBody({ 
                success: true, 
                message: "Sending message succeeded.",
                additional: "Please see Kinvey Flex logs"
            }).ok().next();            
        });
    });
});