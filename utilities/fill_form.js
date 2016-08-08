function fillForm(username, submit) {
    var cities = ['Киев', 'Харьков', 'Львів', 'Івано-Франківськ',
    'Ужгород', 'Одесса', 'Донецк', 'Днипро', 'Херсон', 'Винница'];

    var json = {
        username: username,
        password: 'palm1996' + username,
        passwordconfirm: 'palm1996' + username,
        email: username + '@yopmail.com',
        emailconfirm: username + '@yopmail.com',
        'humanverify[input]': '4',
        'userfield[field2]': cities[Math.round(1 + Math.random() * cities.length - 1)],
        'userfield[field6]': '15',
        month: ('0' + Math.round(1 + Math.random() * 11)).slice(-2),
        day: ('0' + Math.round(1 + Math.random() * 30)).slice(-2),
        year: Math.round(1970 + Math.random() * 30).toString()
    };

    for(var key in json) {
        document.getElementsByName(key)[0].value = json[key];
    }

    document.getElementsByName('userfield[field7]')[0].checked = true;
    document.getElementsByName('agree')[0].checked = true;

    var data = JSON.parse(localStorage.data);
    data[username] = json;
    localStorage.data = JSON.stringify(data);

    if (submit) {
        document.getElementById('registerform').submit();
    }
}
