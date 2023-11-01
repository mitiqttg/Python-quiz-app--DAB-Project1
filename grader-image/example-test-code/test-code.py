import socket
def guard(*args, **kwargs):
  raise Exception("Internet is bad for you :|")
socket.socket = guard

import unittest
from code import *

class TestHello(unittest.TestCase):

  def test_world(self):
    self.assertEqual(world(), "Hello world!", "Function should return 'Hello world!'")