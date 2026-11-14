========================================================
README: NASA FIRMS MODIS or VIIRS Fire/Hotspot Data Download
========================================================

If you requested data from multiple instruments e.g. MODIS (combined Aqua and Terra), VIIRS (S-NPP and/or NOAA-20, NOAA-21) and LANDSAT,
you will receive an email, with download link, for each data source.

This zip file will have either one, two or three naming conventions beginning with:
    DL_FIRE_M-C61_xxxx if you requested MODIS data (C61 stands for MODIS Collection 6.1), or 
    DL_FIRE_J1V-C2_xxx if you requested VIIRS 375m data from  NOAA-20(JPSS-1)
    DL_FIRE_J2V-C2_xxx if you requested VIIRS 375m data from  NOAA-21(JPSS-2)
    DL_FIRE_SV-C2_xxxx if you requested VIIRS 375m data from S-NPP
    DL_FIRE_LS_xxx if you requested LANDSAT 30m data


The xx refers to the download request id/number. The zip file contains the data
for the requested dates in your area-of-interest.

If you requested the data in shape file format you will see the following files
contained in your zip:
    fire_xx.dbf
    fire_xx.prj
    fire_xx.shp
    fire_xx.shx
    fire_xx.cpg
    Readme.txt

If you requested the data in CSV format the file name will look like this: 
    fire_.xx.csv
    Readme.txt

Depending on the date range selected you may receive 1 or 2 files containing
Near Real-Time (NRT) data and/or older standard/science quality data. NRT data
are replaced with standard quality data when they are available (approximately 3 months).

-- fire_nrt_M-C61_xx = MODIS NRT files:(MCD14DL) MODIS Active Fire and Thermal Anomalies
                    product processed by LANCE / FIRMS

-- fire_nrt_SV-C2_xx = VIIRS 375m NRT files:(VNP14IMGTDL) VIIRS Active Fire and Thermal
                    Anomalies product from S-NPP processed by LANCE / FIRMS

-- fire_nrt_J1V-C2_xx = VIIRS 375m NRT files:(VJ114IMGDL) VIIRS Active Fire and Thermal
                    Anomalies product from NOAA-20 (JPSS-1) processed by LANCE / FIRMS

-- fire_nrt_J2V-C2_xx = VIIRS 375m NRT files:(VJ214IMGDL) VIIRS Active Fire and Thermal
                    Anomalies product from NOAA-21 (JPSS-2) processed by LANCE / FIRMS

-- fire_archive_M-C61_xx = MODIS standard quality Thermal Anomalies / Fire locations 
                        processed by the University of Maryland with a 3-month
                        lag and distributed by FIRMS. These standard data (MCD14ML) 
                        replace the NRT (MCD14DL) files when available.

-- fire_archive_SV-C2_xx = VIIRS 375m standard Active Fire and Thermal Anomalies product
                        processed by the University of Maryland with a 3-month lag and
                        distributed by FIRMS. These standard data (VNP14IMGTML) replace
                        the NRT files (VNP14IMGTDL ) when available.

-- fire_nrt_LS_xx = LANDSAT 30m NRT files: LANDSAT Active Fire and Thermal
                    Anomalies product from LANDSAT

