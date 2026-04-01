import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Carousel } from '@mantine/carousel';

import AutoHeight from 'embla-carousel-auto-height';

import ZoomableImage from '../ZoomableImage';

import { listQuestionPicturePublicIds } from '../../lib/questionPictures';

import classes from './QuestionImagesCarousel.module.css';



const HOVER_POLL_MS = 5000;



/**

 * Renders one ZoomableImage or a Mantine carousel when a question has multiple pictures.

 * @param {{ question?: object, imageUrls?: Record<string, string>, instanceKey?: string }} props

 */

export default function QuestionImagesCarousel({ question, imageUrls = {}, instanceKey = '' }) {

  const emblaApiRef = useRef(null);

  const hoverRef = useRef(false);

  const [showArrows, setShowArrows] = useState(false);



  const autoHeightPlugins = useMemo(() => [AutoHeight()], []);

  const handleSlideImageLoad = useCallback(() => {

    emblaApiRef.current?.reInit();

  }, []);



  useEffect(() => {

    const id = setInterval(() => {

      setShowArrows(hoverRef.current);

    }, HOVER_POLL_MS);

    return () => clearInterval(id);

  }, []);



  const handlePointerEnter = useCallback(() => {

    hoverRef.current = true;

    setShowArrows(true);

  }, []);



  const handlePointerLeave = useCallback(() => {

    hoverRef.current = false;

  }, []);



  const publicIds = listQuestionPicturePublicIds(question || {});

  const resolved = publicIds

    .map((id) => ({ id, url: imageUrls[id] }))

    .filter((item) => item.url);



  if (resolved.length === 0) return null;



  const zoomStyle = { width: '100%', marginBottom: 0, maxWidth: '100%' };



  if (resolved.length === 1) {

    return (

      <div style={{ marginBottom: '24px', width: '100%', maxWidth: '100%' }}>

        <ZoomableImage

          key={`${instanceKey}-${resolved[0].id}`}

          src={resolved[0].url}

          alt="Question"

          style={zoomStyle}

        />

      </div>

    );

  }



  return (

    <div

      className={classes.carouselOuter}

      style={{ marginBottom: '24px', width: '100%', maxWidth: '100%' }}

      data-arrows-visible={showArrows ? 'true' : 'false'}

      onPointerEnter={handlePointerEnter}

      onPointerLeave={handlePointerLeave}

    >

      <Carousel

        key={instanceKey}

        withIndicators

        withControls

        height="auto"

        slideSize="100%"

        slideGap="md"

        plugins={autoHeightPlugins}

        getEmblaApi={(api) => {

          emblaApiRef.current = api;

        }}

        emblaOptions={{ loop: false, align: 'start' }}

        classNames={classes}

        styles={{

          root: { width: '100%', maxWidth: '100%' },

          viewport: { height: 'auto' },

          container: { height: 'auto', alignItems: 'flex-start' },

          slide: { height: 'auto' },

        }}

      >

        {resolved.map(({ id, url }) => (

          <Carousel.Slide key={id}>

            <div className={classes.slide}>

              <ZoomableImage

                src={url}

                alt="Question"

                style={zoomStyle}

                onImageLoad={handleSlideImageLoad}

              />

            </div>

          </Carousel.Slide>

        ))}

      </Carousel>

    </div>

  );

}

