/*
  Warnings:

  - A unique constraint covering the columns `[doctorId]` on the table `OTPDoctor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[patientId]` on the table `OTPPatient` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OTPDoctor_doctorId_key" ON "OTPDoctor"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "OTPPatient_patientId_key" ON "OTPPatient"("patientId");
