import { useEffect, useState } from "react";
import { assertTrue, getHeaderStyle } from "../utils"
import UploadPreview from "./UploadPreview";
import Frame from "./Frame";
import { IMAGE_PIXEL_LENGTH, FRAME_PIXEL_COUNT } from "../utils";
import { v4 as uuid } from 'uuid';

export default function Header() {
    const [images, setImages] = useState([]);
    const [imageURLs, setImageURLs] = useState([]);

    useEffect(() => {
        if (images.length < 1) return;
        const newImageURLs = [];
        images.forEach(image => newImageURLs.push(URL.createObjectURL(image)));
        setImageURLs(newImageURLs);
    }, [images]);

    function onImageChange(e) {
        setImages([...e.target.files]);
    }


    return (
        <div className="Header" style={getHeaderStyle()}>
            <input type="file" multiple accept="image/*" onChange={onImageChange} />
            {imageURLs.map(imageSrc => {
                const ID = uuid();
                const binkers = getImageData(imageSrc);
                const binkersData = getHexArray(binkers);
                console.log('BINKERS: ');
                console.log(binkersData);
                return (
                    <>
                        <Frame frame={binkersData} />
                        <img src={imageSrc} key={ID} width="16" height="16" />
                    </>

                );
            })}
        </div>
    );
}

// either need to make a separate comonent to convert list of images to canvas to framlist
// or convert them first then send to another component to be displayed.

function getImageData(imageSrc) {
    const img = new Image();
    img.src = imageSrc;

    const canvas = document.createElement("canvas");
    canvas.width = IMAGE_PIXEL_LENGTH;
    canvas.height = IMAGE_PIXEL_LENGTH;
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    const imageData = context.getImageData(0, 0, IMAGE_PIXEL_LENGTH, IMAGE_PIXEL_LENGTH);
    return imageData;
}

function getHexArray(imageData) {
    const data = imageData.data;
    assertTrue((data.length / 4) === FRAME_PIXEL_COUNT, "Unexpected data size in uploadImage");
    var result = new Array(0);
    for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        // const alpha = data[i + 3]; ignore alpha value
        result.push(rgbToHex(red, green, blue));
    }
    assertTrue(result.length === FRAME_PIXEL_COUNT, "Unexpected array size in uploadImage");
    return result;
}

// converts a set of r, g and b values to its hex equivalent
function rgbToHex(r, g, b) {
    return "0x" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// converts an r, g or b value to its hex equivalent
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}