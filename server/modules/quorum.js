module.exports = {
    GET: function ($) {
        console.log($.req.headers.ip, $.param('page', 1), $.param('q', ''));
        return {
            collection: 'bash_im',
            query: {
                text: {$regex: new RegExp($.param('q', ''), 'i')}
            }
        };
    }
};
