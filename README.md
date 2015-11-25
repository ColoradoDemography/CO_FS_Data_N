# CO_FS_Data_N
Grant Program NodeJS data pipeline

This is a microservice that will export DOLA grants data (as CSV) based upon query parameters.

###Parameters

*start*: date in the format of Day-Month-Year as 01-JAN-2015 or 25-NOV-1998.  The month code is the first three letters of the month - all in caps.  The day of the month must be 2 digits (so use a preceding '0' if you need to.)  A 2 digit or 4 digit year will work.  MANDATORY. (to do, smart default to first date in DB)

*end* date (format same as above).  MANDATORY. (to do, smart default to current date)

*program*: comma delimited list of programs to include.  no spaces between programs, just commas.  OPTIONAL - default is all.  
Can include Formulaic - FML, SEV\_DIST, VFP, CTF, SAR, FFB and Competitive - EIAF, GAME, REDI, DR, CSBG, CDBG, TIRE, CHPG, BEAN

*county*: comma delimited list.  default is all counties.

*lgid*: comma delimited list (will be ignored if you specify the county parameter).  default is none.

Example: All CTF and FML grants in Washington County between Jan 1, 1999 and Dec 10, 2015
http://fierce-horsepower-145829.nitrousapp.com:4000/gather?start=01-JAN-1999&end=10-DEC-2015&program=CTF,FML&county=Washington