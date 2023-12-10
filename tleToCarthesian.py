from sgp4.api import Satrec
from sgp4.api import jday

s = '1 25544U 98067A   23342.03807583  .00012720  00000+0  22837-3 0  9994'
t = '2 25544  51.6393 187.4408 0001241   6.1347  91.3677 15.50264424428752'
satellite = Satrec.twoline2rv(s, t)
jd, fr = jday(2023, 12, 8, 00, 00, 00)
e, r, v = satellite.sgp4(jd, fr)
print(e,r,v)