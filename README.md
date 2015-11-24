# CO_FS_Data_N
Grant Program NodeJS data pipeline

This (will be) is a microservice that will export DOLA grants data (as CSV) based upon query parameters (to be determined).

###Parameters

start: date in the format of Day-Month-Year as 01-JAN-2015 or 25-NOV-1998.  The month code is the first three letters of the month - all in caps.  The day of the month must be 2 digits (so use a preceding '0' if you need to.)  A 2 digit or 4 digit year will work.  MANDATORY. (to do, smart default to first date in DB)

end: date (format same as above).  MANDATORY. (to do, smart default to current date)

programs: comma delimited list of programs to include.  OPTIONAL.  can include FML, EIAF, SEV\_DIST (so far).  Default is all programs.
