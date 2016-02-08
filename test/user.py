from urllib import urlopen
from json import dumps
from sys import argv


def signup(email):
    r = urlopen('http://localhost:8080/user/signup', dumps({
        'email': email,
        'password': '1'
    }))
    print(r.read().decode('utf8'))

print(signup(argv[1]))
