"use client";
import Image from "next/image";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

export default function CarouselClient() {
  return (
    <Carousel showThumbs={false} autoPlay infiniteLoop interval={3000}>
      <div>
        <Image src="/assets/images/5.png" alt="Image 1" width={800} height={300} />
      </div>
      <div>
        <Image src="/assets/images/5.png" alt="Image 2" width={800} height={300} />
      </div>
      <div>
        <Image src="/assets/images/5.png" alt="Image 3" width={800} height={300} />
      </div>
    </Carousel>
  );
}
