import cv2 #import the opencv (computer vision)
from PIL import Image #import the pillow
import os
import numpy as np
import pytesseract 


image_file = "/Users/dilinachathurakaperera/Desktop/personal/projects/PocketAudit/ml-service/receipt1.jpg" #file path of the image 
image = cv2.imread(image_file)

os.makedirs("temp", exist_ok=True)


cv2.imshow("original image", image) #open the image
cv2.waitKey(2000) 
cv2.destroyAllWindows()

#inverted images
inverted_image = cv2.bitwise_not(image)
cv2.imshow("Inverted image" , inverted_image)
cv2.waitKey(2000) 
cv2.destroyAllWindows()


cv2.imwrite("temp/inverted.jpg", inverted_image)
    
#binarization
def grayscale(image):
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

gray_image = grayscale(image)

cv2.imshow("gray image", gray_image)
cv2.waitKey(2000) 
cv2.destroyAllWindows()


cv2.imwrite("temp/gray.jpg", gray_image)

thresh, im_bw = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY+ cv2.THRESH_OTSU)#Otsu’s Method
if np.mean(im_bw) < 50:  # If image is too dark
    im_bw = cv2.adaptiveThreshold(gray_image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                 cv2.THRESH_BINARY, 11, 2)
    
white_pixel_ratio = np.sum(im_bw == 255) / (im_bw.shape[0] * im_bw.shape[1])
if 0.05 < white_pixel_ratio < 0.90:
    cv2.imwrite("temp/bw_image.jpg", im_bw)
    cv2.imshow("black and white image", im_bw)
    print("Using binarized image (good quality)")
else:
    im_bw = gray_image  # Fall back to grayscale
    cv2.imwrite("temp/bw_image.jpg", im_bw)
    cv2.imshow("black and white image - USING GRAYSCALE (poor binarization)", im_bw)
    print("Using grayscale (binarization would lose too much detail)")

cv2.waitKey(2000) 
cv2.destroyAllWindows()

#noise removal
def noise_removal(image):
    kernel = np.ones((2, 2), np.uint8)
    image = cv2.dilate(image, kernel, iterations=1)
    kernel = np.ones((2,2), np.uint8)
    image = cv2.erode(image, kernel, iterations=1)
    image = cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel)
    image = cv2.medianBlur(image,3)
    return (image)

no_noise = noise_removal(im_bw)
cv2.imwrite("temp/no_noise.jpg", no_noise)

cv2.imshow("noise removal image", no_noise)
cv2.waitKey(2000) 
cv2.destroyAllWindows()

#dilation and erosion
def thin_font(image):
    image = cv2.bitwise_not(image)
    kernel = np.ones((1,1), np.uint8)
    image = cv2.erode(image, kernel, iterations=1)
    image = cv2.bitwise_not(image)
    return (image)

eroded_image = thin_font(no_noise)
cv2.imwrite("temp/eroded_image.jpg", eroded_image)

cv2.imshow("noise eroded image", eroded_image)
cv2.waitKey(2000) 
cv2.destroyAllWindows()

def thick_font(image):
    image = cv2.bitwise_not(image)
    kernel = np.ones((1,1), np.uint8)
    image = cv2.dilate(image, kernel, iterations=1)
    image = cv2.bitwise_not(image)
    return (image)

dilated_image = thick_font(no_noise)
cv2.imwrite("temp/dilated_image.jpg", dilated_image)

cv2.imshow("noise dilated image", dilated_image)
cv2.waitKey(2000) 
cv2.destroyAllWindows()

#rotation deskewing
#https://becominghuman.ai/how-to-automatically-deskew-straighten-a-text-image-using-opencv-a0c30aed83df
new = cv2.imread("/Users/dilinachathurakaperera/Desktop/personal/projects/PocketAudit/ml-service/receipt1.jpg")

def getSkewAngle(cvImage) -> float:
    # Prep image, copy, convert to gray scale, blur, and threshold
    newImage = cvImage.copy()
    gray = cv2.cvtColor(newImage, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (9, 9), 0)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

    # Apply dilate to merge text into meaningful lines/paragraphs.
    # Use larger kernel on X axis to merge characters into single line, cancelling out any spaces.
    # But use smaller kernel on Y axis to separate between different blocks of text
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 5))
    dilate = cv2.dilate(thresh, kernel, iterations=2)

    # Find all contours
    contours, hierarchy = cv2.findContours(dilate, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key = cv2.contourArea, reverse = True)
    for c in contours:
        rect = cv2.boundingRect(c)
        x,y,w,h = rect
        cv2.rectangle(newImage,(x,y),(x+w,y+h),(0,255,0),2)

    # Find largest contour and surround in min area box
    largestContour = contours[0]
    print (len(contours))
    minAreaRect = cv2.minAreaRect(largestContour)
    cv2.imwrite("temp/boxes.jpg", newImage)
    # Determine the angle. Convert it to the value that was originally used to obtain skewed image
    angle = minAreaRect[-1]
    if angle < -45:
        angle = 90 + angle
    return -1.0 * angle
# Rotate the image around its center
def rotateImage(cvImage, angle: float):
    newImage = cvImage.copy()
    (h, w) = newImage.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    newImage = cv2.warpAffine(newImage, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return newImage

# Deskew image
def deskew(cvImage):
    angle = getSkewAngle(cvImage)
    return rotateImage(cvImage, -1.0 * angle)

fixed = deskew(new)
cv2.imwrite("temp/rotated_fixed.jpg", fixed)

cv2.imshow("noise rotated image", fixed)
cv2.waitKey(2000) 
cv2.destroyAllWindows()

#removing boarders
cv2.imshow("noise removal image", no_noise)
cv2.waitKey(2000) 
cv2.destroyAllWindows()


def remove_borders(image):
    contours, heiarchy = cv2.findContours(image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cntsSorted = sorted(contours, key=lambda x:cv2.contourArea(x))
    cnt = cntsSorted[0]
    x, y, w, h = cv2.boundingRect(cnt)
    crop = image[y:y+h, x:x+w]
    return (crop)

no_borders = remove_borders(no_noise)
cv2.imwrite("temp/no_borders.jpg", no_borders)

cv2.imshow("noise no boarders image", no_borders)
cv2.waitKey(2000) 
cv2.destroyAllWindows()

#missing borders
color = [255, 255, 255]
top, bottom, left, right = [150]*4
image_with_border = cv2.copyMakeBorder(no_borders, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)

cv2.imwrite("temp/image_with_border.jpg", image_with_border)
cv2.imshow("noise with white boarder image", image_with_border)
cv2.waitKey(2000) 
cv2.destroyAllWindows()

#pytesseract


from Levenshtein import distance
 
# 4. Accuracy Calculation (unchanged)
ground_truth = """SEN LEE HEONG RESTAURANT  
CO NO.(002083199-T)  
GST ID NO.(001115316224)  
G-0-1, M. AVENUE NO.1, JLN 1/38A,  
SEGAMBUT BAHAGIA, 51200, K. LUMPUR  
TEL: 012-2525903 / 03-6258 5987  

Cashier: Manager     MachNo: 0000  

Item             Qty   Price   Amount  
-------------------------------------  
Table Number:     4  
FOOD SR           1     67.00   RM 67.00  
BIG RICE SR       2      1.50   RM  3.00  
TEA POT SR        1      3.00   RM  3.00  

                         Subtotal  RM 73.00  

GST TAX AMT:               RM 73.00  
GST(6.0%) Amount:          RM  4.38  
ROUND ADJ                 RM  0.02  

Item: 4  
TOTAL                     RM 77.40  

Cash                      RM 77.40  

12-01-2018  21:53  
TAX Invoice: #11372  

        THANK YOU  
     PLEASE COME AGAIN  
"""

ocr_text = pytesseract.image_to_string(gray_image)
accuracy = 1 - distance(ground_truth, ocr_text) / max(len(ground_truth), len(ocr_text))
print(f"OCR Accuracy: {accuracy:.2%}")