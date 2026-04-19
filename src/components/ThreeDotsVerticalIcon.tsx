interface ThreeDotsVerticalIconProps {
  className?: string;
}

export default function ThreeDotsVerticalIcon(props: ThreeDotsVerticalIconProps) {
  const { className = 'size-4' } = props;

  return (
    <svg className={className} version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <title>Menu</title>
      <g>
        <path
          d="M12,17 C13.3807118,17 14.5,18.1192882 14.5,19.5 C14.5,20.8807118 13.3807118,22 12,22 C10.6192882,22 9.5,20.8807118 9.5,19.5 C9.5,18.1192882 10.6192882,17 12,17 Z M12,9.5 C13.3807118,9.5 14.5,10.6192882 14.5,12 C14.5,13.3807118 13.3807118,14.5 12,14.5 C10.6192882,14.5 9.5,13.3807118 9.5,12 C9.5,10.6192882 10.6192882,9.5 12,9.5 Z M12,2 C13.3807119,2 14.5,3.11928814 14.5,4.5 C14.5,5.88071186 13.3807119,7 12,7 C10.6192881,7 9.5,5.88071186 9.5,4.5 C9.5,3.11928814 10.6192881,2 12,2 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
